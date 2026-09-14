New project jyotish-query.

Background:
https://www.yournetastrologer.com/
https://github.com/rsaisankalp/vedic-jyotish-api
https://jyotish.local.allthisisthat.net

project is being constructed at remote LAN server "ssh mooncaptain@jyotish".
project is located at /home/mooncaptain/jyotish-chart-saas
    above is a venv

The above github project is now loaded on my server and also has been unhooked from github and re-hooked as my project so the whole thing is under git control.

I would like to build a front end to submit a series of queries to the service and then analyze the results and identify qualifying submissions as good or not.

Each submission consists of a location given as longitude, latitude, timezone,  date,  and time. For each series of queries the user will supply the location. The time will be calculated from the current time and incremented programmatically for each subsequent submission. After the data is returned from the service the front end application will analyze the data according to criteria laid out below. 

a request to the server looks like this: 
```json
    curl -X POST http://jyotish.pn.net:8000/api/v1/chart \
    -H "Content-Type: application/json" \
    -d '{
        "date": "1948-07-02",
        "time": "08:28:00",
        "latitude": 47.4833,
        "longitude": -122.2166,
        "timezone_offset": -8
    }'
```
Review the file me-response.json to see an example of a response schema.
In this file there are 10 high level headers: The ones that are of interest to this project are: name, birth_data, ayanamsa, lagna, grahas (an array of 9), the D9 Divisional Chart (9th element of the array), the 1st Dasha and all of its antardashas no lower level sub arrays.  Ignore bhavas, panchanga, ashtakavarga.

Jargon - Translating some of the sanskrit terms to English to avoid confusion when I forget to use sanskrit.
Note: in Jyotish the word graha refers to the sun, moon, mercury, venus, mars, jupiter, saturn, and the lunar nodes (north and south). In English you will see all these referred to as planets - clearly they are not all planets - please adjust within the context of this project.
lagna - 1st house, ascendant, rising sign
grahas - planets 
graha - a particular planet
rashi - sign (signs are numbered 1 through 12 and also each have a name)
house - also numbered 1 - 12.

Dushtana refers to the inauspicious or challenging houses in a birth chart. These are specifically Houses 6, 8, and 12, collectively known as the Dushtana Houses.

Rahu and Ketu - are the jyotish names for the lunar nodes - the northern node is Rahu and the southern node is Ketu. These are always malefic planets.

By looking at the signs.md file you can see that each planet (graha), excluding Rahu and Ketu has one Moolatrikona sign. This is also called the root sign for the planet.

For each rising sign it is possible to identify additional malefic planets. If a planet's Moolatrikona sign occupies the 6th , 8th, or 12th house then if becomes a malefic for that rising sign. See file "Functional Malefics.md".

lagna - rashi indicates the sign number that will be associated with the 1st house.

How to draw a north Indian chart.
1. the degree_in_rashi value is written into the 1st house square with a label to the left of the value. The label is "As" short for ascendant. The value is formatted "N:NN".
2. draw a square.
3. draw diagonal lines from each corner to its opposite corner.
4. draw another square inside the first square with its corners at the center of each line of the first square.
5. there are now 4 squares and 8 triangles making up the chart. Each square is oriented like a diamond with one corner at the top. The top center square is the 1st house. The triangle to the left of the 1st house is the second house and so on around the chart in counter clockwise order. The 3rd house a triangle and the 4th house is a square. 5th and 6th houses are triangles and 7th house is a square. 8th and 8th houses are triangles and 10th house is a square. 11th and 12 houses are triangles. 
6. Each house in the chart will be labeled with the sign that occupies that house. This is based on the lagna data where the rishi or sign number of the ascendant is found. For example if the lagna rishi is 6 then the 2nd house holds the 7th sign and so on around the chart counter clockwise.
7. the squares are labeled with the appropriate number in the left corner. The triangles for the 2nd house and 12th house have their numbers at top and left corner. The triangles for the 3rd and 5th houses are labeled at the topmost corner. the 6th and 8th houses have labels in lower left corner. the 9th and 11th houses have labels in left most corner.
8. As each graha record is read you will have the information to place the planet in the proper house. degree_in_rashi provides the house degree. rashi provides the sign number so the house can be located from that. graha provides the label - use the first two letters to make the label. When placing labels for ascendant and planet names arranged them in a column at the horizontal center of the house. Center the list vertically. Order the column by degree with the lowest degree at the top.

Let's build a chart with the data in me-request.json.
We could extend the current uvicorn server to include a page to present a North Indian chart. That would be on the jyotish.pn.net ubuntuserver. And continue doing the analysis step there as well.
Or, alternatively, build a c# client in .net on my windows and use the jyothish.pn.net server as a saas. build the chart display and analysis in a winforms app in .net.

After that I'll fill in more details on the analysis steps.
