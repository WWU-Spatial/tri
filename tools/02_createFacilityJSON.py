import os
import json
import sqlite3
import numpy as np
from scipy import stats
import naics_dict
import sic_dict

# http://stackoverflow.com/a/3300514
def dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d

INPUT_SQLITE_DB = r"C:\Users\Jacob\Downloads\easyrsei_v234_64bit\tri.sqlite"
OUTPUT_FOLDER = r"C:\Users\Jacob\Downloads\easyrsei_v234_64bit\json"

naics_lookup = naics_dict.naicslookup
sic_lookup = sic_dict.siclookup

facilities = {}

# Setup database connection to sqlite database
db_conn = sqlite3.connect(INPUT_SQLITE_DB)
db_conn.row_factory = dict_factory
cur = db_conn.cursor()

# Get all facility metadata from facility table
cur.execute('SELECT * FROM Facility')
all_facilities = cur.fetchall()

# Add a few dictionaries fot the various derived datapoints and attach to each facility
for facility in all_facilities:
	fn = facility["FacilityNumber"]
	facilities[fn] = dict(facility)
	
	emissions = facilities[fn]["Emissions"] = {}



# Get all Emission/Submission datapoints
cur.execute('SELECT FacilityNumber, SubmissionYear, CASStandard, ChemicalNumber, SortName as Chemical, sum(SumOfPoundsPT) AS Pounds, sum(sumOfScore) AS Score FROM ResultsByFacilityYearMediaAndChemical WHERE Media <= 2 GROUP BY FacilityID, CASStandard ORDER BY SubmissionYear;')
all_emissions = cur.fetchall()



for emission in all_emissions:
	fn = emission["FacilityNumber"]

	facility = facilities[fn]
	year = emission["SubmissionYear"]

	# Remove fields we don't want showing up in our output json
	emission.pop("SubmissionYear")
	emission.pop("FacilityNumber")

	# Create an object for each year, if it doesn't exist
	facility["Emissions"].setdefault(year, {})

	# Create an array in each year if it doesn't exist and append the emission data
	facility["Emissions"][year].setdefault("Submissions", []).append(emission)

# These objects keep track of all facility pounds and scores by year for calculating percentile
us_pounds = {}
us_scores = {}

us_sic_pounds = {}
us_sic_scores = {}

us_naics_pounds = {}
us_naics_scores = {}

state_pounds = {}
state_scores = {}

state_sic_pounds = {}
state_sic_scores = {}

state_naics_pounds = {}
state_naics_scores = {}

# Sum pounds and score for each year
j=0
for fn in facilities:
	j+=1
	if j % 5000 == 0:
		print j
	
	# Set up SIC objects
	for i in range(1, 8):
		code = facilities[fn]["SIC" + str(i)]
		if (code != "NULL"):
			facilities[fn]["SIC" + str(i)] = {}
			facilities[fn]["SIC" + str(i)]["siccode"] = code
			if code != "INVALD" and code != "INVA" and code != "NR":
				facilities[fn]["SIC" + str(i)]["name"] = sic_lookup[code]

	for i in range(1, 7):
		code = facilities[fn]["NAICS" + str(i)]
		if (code != "NULL"):
			facilities[fn]["NAICS" + str(i)] = {}
			facilities[fn]["NAICS" + str(i)]["naicscode"] = code
			if code != "INVALD" and code != "INVA" and code != "NR":
				facilities[fn]["NAICS" + str(i)]["name"] = naics_lookup[code]


	for year in facilities[fn]["Emissions"]:
		TotalScore = 0
		TotalPounds = 0
		for submission in facilities[fn]["Emissions"][year]["Submissions"]:
			TotalPounds += submission["Pounds"]
			TotalScore += submission["Score"]

		# Set value in master dictionary for output to json
		facilities[fn]["Emissions"][year]["TotalPounds"] = TotalPounds
		facilities[fn]["Emissions"][year]["TotalScore"] = TotalScore

		# Append values to arrays for calculating percentile
		us_pounds.setdefault(year, []).append(TotalPounds)
		us_scores.setdefault(year, []).append(TotalScore)

		state_pounds.setdefault(facilities[fn]["State"], {}).setdefault(year, []).append(TotalPounds)
		state_scores.setdefault(facilities[fn]["State"], {}).setdefault(year, []).append(TotalScore)

		for i in range(1, 8):
			if (facilities[fn]["SIC" + str(i)] != "NULL"):
				us_sic_pounds.setdefault(facilities[fn]["SIC" + str(i)]["siccode"], {}).setdefault(year, []).append(TotalPounds)
				us_sic_scores.setdefault(facilities[fn]["SIC" + str(i)]["siccode"], {}).setdefault(year, []).append(TotalScore)
				state_sic_pounds.setdefault(facilities[fn]["SIC" + str(i)]["siccode"], {}).setdefault(facilities[fn]["State"], {}).setdefault(year, []).append(TotalPounds)
				state_sic_scores.setdefault(facilities[fn]["SIC" + str(i)]["siccode"], {}).setdefault(facilities[fn]["State"], {}).setdefault(year, []).append(TotalScore)

		for i in range(1, 7):
			if (facilities[fn]["NAICS" + str(i)] != "NULL"):
				us_naics_pounds.setdefault(facilities[fn]["NAICS" + str(i)]["naicscode"], {}).setdefault(year, []).append(TotalPounds)
				us_naics_scores.setdefault(facilities[fn]["NAICS" + str(i)]["naicscode"], {}).setdefault(year, []).append(TotalScore)
				state_naics_pounds.setdefault(facilities[fn]["NAICS" + str(i)]["naicscode"], {}).setdefault(facilities[fn]["State"], {}).setdefault(year, []).append(TotalPounds)
				state_naics_scores.setdefault(facilities[fn]["NAICS" + str(i)]["naicscode"], {}).setdefault(facilities[fn]["State"], {}).setdefault(year, []).append(TotalScore)

for fn in facilities:
	id = facilities[fn]["FacilityID"]
	for year in facilities[fn]["Emissions"]:
		facilities[fn]["Emissions"][year]["us_pounds_percentile"] = int(stats.percentileofscore(us_pounds[year], facilities[fn]["Emissions"][year]["TotalPounds"]))
		facilities[fn]["Emissions"][year]["us_score_percentile"] = int(stats.percentileofscore(us_scores[year], facilities[fn]["Emissions"][year]["TotalScore"]))
		facilities[fn]["Emissions"][year]["state_pounds_percentile"] = int(stats.percentileofscore(state_pounds[facilities[fn]["State"]][year], facilities[fn]["Emissions"][year]["TotalPounds"]))
		facilities[fn]["Emissions"][year]["state_score_percentile"] = int(stats.percentileofscore(state_scores[facilities[fn]["State"]][year], facilities[fn]["Emissions"][year]["TotalScore"]))
		for i in range(1, 8):
			if (facilities[fn]["SIC" + str(i)] != "NULL"):
				facilities[fn]["SIC" + str(i)].setdefault(year, {})["us_pounds_pct"] = int(stats.percentileofscore(us_sic_pounds[facilities[fn]["SIC" + str(i)]["siccode"]][year], facilities[fn]["Emissions"][year]["TotalPounds"]))
				facilities[fn]["SIC" + str(i)].setdefault(year, {})["us_score_pct"] = int(stats.percentileofscore(us_sic_scores[facilities[fn]["SIC" + str(i)]["siccode"]][year], facilities[fn]["Emissions"][year]["TotalScore"]))
				facilities[fn]["SIC" + str(i)].setdefault(year, {})["state_pounds_pct"] = int(stats.percentileofscore(state_sic_pounds[facilities[fn]["SIC" + str(i)]["siccode"]][facilities[fn]["State"]][year], facilities[fn]["Emissions"][year]["TotalPounds"]))
				facilities[fn]["SIC" + str(i)].setdefault(year, {})["state_score_pct"] = int(stats.percentileofscore(state_sic_scores[facilities[fn]["SIC" + str(i)]["siccode"]][facilities[fn]["State"]][year], facilities[fn]["Emissions"][year]["TotalScore"]))
				facilities[fn]["SIC" + str(i)].setdefault(year, {})["state_count"] = len(state_sic_pounds[facilities[fn]["SIC" + str(i)]["siccode"]][facilities[fn]["State"]][year])
				facilities[fn]["SIC" + str(i)].setdefault(year, {})["us_count"] = len(us_sic_pounds[facilities[fn]["SIC" + str(i)]["siccode"]][year])
		for i in range(1, 7):
			if (facilities[fn]["NAICS" + str(i)] != "NULL"):
				facilities[fn]["NAICS" + str(i)].setdefault(year, {})["us_pounds_pct"] = int(stats.percentileofscore(us_naics_pounds[facilities[fn]["NAICS" + str(i)]["naicscode"]][year], facilities[fn]["Emissions"][year]["TotalPounds"]))
				facilities[fn]["NAICS" + str(i)].setdefault(year, {})["us_score_pct"] = int(stats.percentileofscore(us_naics_scores[facilities[fn]["NAICS" + str(i)]["naicscode"]][year], facilities[fn]["Emissions"][year]["TotalScore"]))
				facilities[fn]["NAICS" + str(i)].setdefault(year, {})["state_pounds_pct"] = int(stats.percentileofscore(state_naics_pounds[facilities[fn]["NAICS" + str(i)]["naicscode"]][facilities[fn]["State"]][year], facilities[fn]["Emissions"][year]["TotalPounds"]))
				facilities[fn]["NAICS" + str(i)].setdefault(year, {})["state_score_pct"] = int(stats.percentileofscore(state_naics_scores[facilities[fn]["NAICS" + str(i)]["naicscode"]][facilities[fn]["State"]][year], facilities[fn]["Emissions"][year]["TotalScore"]))
				facilities[fn]["NAICS" + str(i)].setdefault(year, {})["state_count"] = len(state_naics_pounds[facilities[fn]["NAICS" + str(i)]["naicscode"]][facilities[fn]["State"]][year])
				facilities[fn]["NAICS" + str(i)].setdefault(year, {})["us_count"] = len(us_naics_pounds[facilities[fn]["NAICS" + str(i)]["naicscode"]][year])

for fn in facilities:
	id = facilities[fn]["FacilityID"]
	with open(os.path.join(OUTPUT_FOLDER, str(id) +".json"), "w") as outjson:
		json.dump(facilities[fn], outjson)