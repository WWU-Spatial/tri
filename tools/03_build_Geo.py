# -*- coding: utf-8 -*-
"""
Created on Wed Mar  2 11:42:13 2016

@author: Derek
"""
import os
import json

import ogr

outputName = "facilities/facilities.shp"
ogr.UseExceptions()
driver = ogr.GetDriverByName("ESRI Shapefile")
if os.path.exists(outputName):
    driver.DeleteDataSource(outputName)
outSource = driver.CreateDataSource(outputName)
outLayer = outSource.CreateLayer(outputName, geom_type = ogr.wkbPoint)
idField = ogr.FieldDefn("ID", ogr.OFTString)
#idField.SetWidth(15)
nameField = ogr.FieldDefn("Name", ogr.OFTString)

outLayer.CreateField(idField)
outLayer.CreateField(nameField)

for k in range(1988, 2015):
    d = ogr.FieldDefn("{0}TotLbs".format(str(k)), ogr.OFTInteger)
    e = ogr.FieldDefn("{0}TotScr".format(str(k)), ogr.OFTReal)
    e.SetPrecision(10)
    outLayer.CreateField(d)
    outLayer.CreateField(e)
    #print k




featureDefn = outLayer.GetLayerDefn()



folder = "json"
for i in os.listdir(folder):
    #print (i)
    path = "{0}/{1}".format(folder, i)
    #print (path)
    with open(path) as file:
        a = json.load(file)

        lng = a['Longitude']
        lat = a['Latitude']
        ID = a['FacilityID']
        name = a['FacilityName']

        point = ogr.Geometry(ogr.wkbPoint)
        point.AddPoint(lng, lat)
        outFeature = ogr.Feature(featureDefn)
        outFeature.SetGeometry(point)
        outFeature.SetField("ID", str(ID))
        outFeature.SetField("Name", str(name))
        
        for j in range(1988, 2015):
            try:
                #print "{0}TotLbs: {1}".format(str(j), a['Emissions']["{0}".format(j)]['TotalPounds'])
                outFeature.SetField("{0}TotLbs".format(str(j)), a['Emissions']["{0}".format(j)]['TotalPounds'])
            except Exception as e:
                continue
            try:
                if (a['Emissions']["{0}".format(j)]['TotalScore'] > 10):
                    outFeature.SetField("{0}TotScr".format(str(j)), round(a['Emissions']["{0}".format(j)]['TotalScore']))
                else: 
                    outFeature.SetField("{0}TotScr".format(str(j)), a['Emissions']["{0}".format(j)]['TotalScore'])
            except Exception as e:
                continue
        outLayer.CreateFeature(outFeature)