Project Name: jyotish-query

The current folder; /mnt/c/Users/brook/Desktop/builds/jyotish-query is used as a scratch pad for discussions, ideas, plans, and todo lists for the project.

I have moved all the documents created during the previous phase into a subfolder 
 - C:\Users\brook\Desktop\builds\jyotish-query\CompletedJyotishQuery-md-files

Background:
The knowledge space:
 - https://www.yournetastrologer.com/

The the starting place of the code - this is an API that provides the basic astronomical / astrological calls necessary in jyotish astrology to build birth charts.
 - https://github.com/rsaisankalp/vedic-jyotish-api

project is being constructed at remote LAN server "ssh mooncaptain@jyotish".

currently I run it from a systemd service -> /etc/systemd/system/jyotish.service;

For a summary background read the help files on the dev server at /home/mooncaptain/jyotish-chart-saas/static/*.MD

Current state of the software: It isn't a fully fleshed jyotish application. The main focus is on Muhurta searching.

The elements are:
 - The main page
   - The Natal Chart
   - Navamsa
   - Rashi Data
   - Dasha Periods

 - the menu
   - Settings
   - Charts
     - New Chart
     - Charts
   - Atlas
     - New Locations
     - Locations
     - Custom Locations
   - Analysis
   - Mahurta
   - Help
     - several elemnets

The new stuff to add.

Transit charts
Divisional charts - maybe.

