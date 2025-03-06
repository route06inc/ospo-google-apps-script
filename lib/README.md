# lib

* Functions that start with a lowercase letter are treated as public functions and are implemented to be available for use from other `.js` files.
    * Functions that start with `_` are treated as private functions.
* Refer to the JSDoc in the code for usage instructions.

## [github.js](github.js)

* gitHubGetStargazers
* gitHubGetTrafficViews
* gitHubGetTrafficClones
* gitHubGetTrafficReferrers

## [star_service.js](star_service.js)

* updateSheetWithStargazers

## [traffic_service.js](traffic_service.js)

* updateSheetWithLatestTrafficViews
* updateSheetWithLatestTrafficClones
* updateSheetWithLatestTrafficReferrers

## [util.js](util.js)

* clearColumnsFromTopLeft
* formatDate
* getNextRow
* getTargetRange
* vlookupWithDateOrEmpty
