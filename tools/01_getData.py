import os
import re
import sqlite3
import pypyodbc #Needs to be installed separately

OUTPUT_SQLITE_DB = r"C:\Users\Jacob\Downloads\easyrsei_v234_64bit\tri.sqlite"

INPUT_DATABASE_2 = r"C:\Users\Jacob\Downloads\easyrsei_v234_64bit\Data_2_V234.accdb"
INPUT_DATABASE_3 = r"C:\Users\Jacob\Downloads\easyrsei_v234_64bit\Data_3_V234.accdb"

# Create SQLITE Database
conn = sqlite3.connect(OUTPUT_SQLITE_DB)
#conn.text_factory = str
cursor = conn.cursor()

for db in [INPUT_DATABASE_2, INPUT_DATABASE_3]:
	db_conn = pypyodbc.connect(r"Driver={Microsoft Access Driver (*.mdb, *.accdb)};Dbq=" + db)
	db_cur = db_conn.cursor()
	tables = []

	for row in db_cur.tables():
		if row[3] == "TABLE":
			tables.append(row[2])

	# Get DATABASE_2 Tables
	for table in tables:
		#print table
		
		columns = []
		for column in db_cur.columns(table=table):
			#print '    {} [{}({})]'.format(column[3], column[5], column[6])
			col_name = re.sub('[^a-zA-Z0-9]', '_', column[3])
			columns.append('{} {}({})'.format(col_name, column[5], column[6]))
		cols = ', '.join(columns)
		
		# Drop table if it exists in sqlite database then create new
		conn.execute('DROP TABLE IF EXISTS "{}"'.format(table))
		conn.execute('CREATE TABLE "{}" ({})'.format(table, cols))
		
		db_cur.execute('SELECT * FROM "{}"'.format(table))
		
		for row in db_cur:
			values = []
			for value in row:
				if value is None:
					values.append(u'NULL')
				else:
					if isinstance(value, bytearray):
						value = sqlite3.Binary(value)
					else:
						value = u'{}'.format(value)
					values.append(value)
					
			v = ', '.join(['?']*len(values))
			sql = 'INSERT INTO "{}" VALUES(' + v + ')'
			conn.execute(sql.format(table), values)

conn.commit()
conn.close()

