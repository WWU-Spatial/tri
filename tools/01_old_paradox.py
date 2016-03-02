#NOTE: YOU MUST PROMOTE THE TRI USER TO SUPERUSER BEFORE LOADING THE DATABASE.  REMEMBER TO DEMOTE TRI BACK TO A REGULAR USER UPON COMPLETEION
# ALTER USER tri SUPERUSER
# ALTER USER tri NOSUPERUSER

import os
import tempfile
import subprocess
import csv
import sqlite3

#Paradox Datatypes: http://msdn.microsoft.com/en-us/library/windows/desktop/ms709362(v=vs.85).aspx
#sqlite Datatypes: http://www.sqlite.org/datatype3.html
datatype_map = {
	'unknown: 18' : 'text',
	'blob' : 'text',
	'alpha' : 'text',
	'incremental' : 'integer',
	'bcd' : 'real',
	'bytes' : 'blob',
	'date' : 'text',
	'image' : 'blob',
	'logical' : 'integer',
	'long integer' : 'integer',
	'memo' : 'text',
	'money' : 'real',
	'number' : 'real',
	'short integer' : 'integer',
	'time' : 'text',
	'timestamp' : 'text'
}

databases = [
			'Category',
			'Chemical',
			'chsql',
			'County',
			'CountyExp',
			'Elements',
			'ERF1_2',
			'Facility',
			'MCL',
			'MEDIA',
			'NAICSTable',
			'NHDPops',
			'Normal',
			'Normal1988',
			'Normal1996',
			'Offsite',
			'Reach',
			'ReachPops',
			'Release',
			'Sictable',
			'Submission',
			#'Weather',		#Contains blobs which are problematic
			'wsdb',
			'Zipcode'
			]
			
delimiter = '|'
header_text = '== File-header =='
fields_text = '== Fields =='

#Create sqlite database and cursor
conn = sqlite3.connect("tri.db") # or use :memory: to put it in RAM
conn.text_factory = str  #bugger 8-bit bytestrings
cursor = conn.cursor()

for database in databases:
	print(database)
	import_db = r'../database/%s.db' % database

	pxinfo = subprocess.Popen(['pxtools\pxinfo.exe', '-f', import_db], stdout = subprocess.PIPE)
	stdout, stderr = pxinfo.communicate()
	pxinfo = None

	header_pos = stdout.find(header_text)
	fields_pos = stdout.find(fields_text)

	headers = {}
	for header in stdout[header_pos + len(header_text):].splitlines():
		if header != '':
			if header.startswith('File-Version'):
				headers['file_version'] = header[13:].strip()
			elif header.startswith('Filetype'):
				headers['filetype'] = header[9:].strip()
			elif header.startswith('Tablename'):
				headers['Tablename'] = header[10:].strip()
			elif header.startswith('Sort-Order'):
				headers['Sort-Order'] = header[11:].strip()
			elif header.startswith('Write-Protection'):
				headers['Write-Protection'] = header[17:].strip()
			elif header.startswith('Codepage'):
				headers['Codepage'] = header[9:].strip()
			elif header.startswith('Number of Blocks'):
				headers['Block-Count'] = header[17:].strip()	
			elif header.startswith('Used Blocks'):
				headers['Used-Blocks'] = header[12:].strip()
			elif header.startswith('First Block'):
				headers['First-Block'] = header[12:].strip()	
			elif header.startswith('Number of Records'):
				headers['Record-Count'] = header[18:].strip()
			elif header.startswith('Max. Tablesize'):
				headers['Max-Tablesize'] = header[15:].strip()
			elif header.startswith('Recordsize'):
				headers['Recordsize'] = header[11:].strip()
	
	input_fields = []
	for field in stdout[fields_pos + len(fields_text):].splitlines():
		if field != '':
			type_pos = field.find('Type:')
			size_pos = field.find('Size:')
			
			name = field[6 : type_pos].strip().replace('/', "_")
			type = field[type_pos + 5 : size_pos].strip()
			size = int(field[size_pos + 5 :].strip())
			input_fields.append([name, type, size])

	stdout, stderr = None, None


	csv_file = tempfile.NamedTemporaryFile(delete=False)
	pxcsvdump = subprocess.call(['pxtools\pxcsvdump.exe', 
								'-D', '|', 
								'-f', import_db], 
								stdout = csv_file,
								stdin = subprocess.PIPE,
								stderr=subprocess.PIPE)

	pxcsvdump = None
	csv_file.close()
	csv_file = open(csv_file.name, 'r')

	csv_file_utf8 = tempfile.NamedTemporaryFile(delete=False)
	for line in csv_file.readlines():
		#csv_file_utf8.write(line.decode('cp1252').replace('"', '').replace('NULL', '').encode('utf-8'))
		csv_file_utf8.write(line)
	csv_file.close()
	csv_file_utf8.close()

	table_name = os.path.basename(os.path.splitext(import_db)[0]).lower()
	

	#Drop Table Commands
	cursor.execute('DROP TABLE IF EXISTS %s;\n\n' % table_name)

	#Create Table Commands
	output_fields = []
	for field in input_fields:
		if field[1].lower() == 'alpha':
			output_fields.append(field[0] + ' ' + datatype_map[field[1].lower()] + '(' + str(field[2]) + ')')
		else:
			output_fields.append(field[0] + ' ' + datatype_map[field[1].lower()])
	
	
	sql = 'INSERT INTO %s VALUES (' % table_name + ','.join(['?'] * len(output_fields)) + ')'

	cursor.execute('CREATE TABLE %s (%s);\n\n' % (table_name, ','.join(output_fields)))

	#Load Table Commands
	
	csvData = csv.reader(open(csv_file_utf8.name, "rb"), delimiter="|", quotechar = '"', quoting=csv.QUOTE_NONE)
	cursor.executemany(sql, csvData)
	conn.commit()

	#os.remove(csv_file_utf8.name)
	#os.remove(csv_file.name)