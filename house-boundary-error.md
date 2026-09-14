Background - necessary understanding to fix a known calculation error.
- this api is based on the Swiss ephemeris which has the following characteristic.
- The zero-degree location for the Swiss Ephemeris in Western tropical astrology is anchored to the March equinox point.
- the jyotish api adjusts this to sidereal astrology by applying the current Ayanamsa (offset)
- the calculation for this conversion is built into this api.
- going from 0 degrees and moving counter clockwise on the jyotish chart the degrees increase.
- in jyotish astrology the chart is divided into 12 houses each with 30 degree range but the influence of the various objects in the chart crosses the house boundaries.
- When you examine the code there are a lot of calculations related to the sphere of influence.
- all these calcutions should "roll over" into the next house if the object is within 5 degrees of a house boundary 0 degrees for 30 degrees.

the observed current error is regarding the malefic influence of a malefic planet for rahu and ketu placed greater than 25 degrees and influencing the MEP (i.e ascendant degree applied to all houses) which is near 0 degrees.

Please explore the code and report back to me what you find. do not change any code on the development machine.

