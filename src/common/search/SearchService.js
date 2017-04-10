(function() {
  var module = angular.module('loom_search_service', []);

  var httpService_ = null;
  var q_ = null;
  var configService_ = null;
  var mapService_ = null;
  var searchlayer_ = null;

  module.provider('searchService', function() {
    this.$get = function($rootScope, $http, $q, $translate, configService, mapService) {
      httpService_ = $http;
      q_ = $q;
      configService_ = configService;
      mapService_ = mapService;

      searchlayer_ = new ol.layer.Vector({
        metadata: {
          title: $translate.instant('search_results'),
          internalLayer: true
        },
        source: new ol.source.Vector({
          parser: null
        }),
        style: function(feature, resolution) {
          return [new ol.style.Style({
            image: new ol.style.Circle({
              radius: 8,
              fill: new ol.style.Fill({
                color: '#D6AF38'
              }),
              stroke: new ol.style.Stroke({
                color: '#000000'
              })
            })
          })];
        }
      });

      $rootScope.$on('translation_change', function() {
        searchlayer_.get('metadata').title = $translate.instant('search');
      });

      return this;
    };

    // algorithm taken from http://janmatuschek.de/LatitudeLongitudeBoundingCoordinates#Java
    // from the "Boundingcoordinates" method
    convertLatLonToBbox = function(coordinates) {
      // This is the distance in km of the radius of the "greater circle"
      // that is, distance to an imagined point at the edge of our view
      // unit is in km
      var distanceKM = 2;
      // Setting the radius to an approximation of the world's radius in km
      var radiusKM = 6371.01;

      var distanceRadians = distanceKM / radiusKM;

      var radLat = coordinates[1] * (Math.PI / 180);
      var radLon = coordinates[0] * (Math.PI / 180);
      var minLat = radLat - distanceRadians;
      var maxLat = radLat + distanceRadians;

      var minLon, maxLon;
      var MIN_LAT = -Math.PI / 2;
      var MAX_LAT = Math.PI / 2;
      var MIN_LON = -Math.PI;
      var MAX_LON = Math.PI;

      if (minLat > MIN_LAT && maxLat < MAX_LAT) {
        var deltaLon = Math.asin(Math.sin(distanceRadians) / Math.cos(radLat));
        minLon = radLon - deltaLon;
        if (minLon < MIN_LON) {
          minLon += Math.PI * 2;
        }
        maxLon = radLon + deltaLon;
        if (maxLon > MAX_LON) {
          maxLon -= Math.PI * 2;
        }
      } else {
        // a pole is within the distance
        minLat = Math.max(minLat, MIN_LAT);
        maxLat = Math.min(maxLat, MAX_LAT);
        minLon = MIN_LON;
        maxLon = MAX_LON;
      }
      // convert back to degrees
      minLat = minLat * (180 / Math.PI);
      minLon = minLon * (180 / Math.PI);
      maxLat = maxLat * (180 / Math.PI);
      maxLon = maxLon * (180 / Math.PI);
      return [minLat, maxLat, minLon, maxLon];
    };

    this.performSearch = function(address) {
      var currentView = mapService_.map.getView().calculateExtent([$(window).height(), $(window).width()]);
      var minBox = ol.proj.transform([currentView[0], currentView[1]],
          mapService_.map.getView().getProjection(), 'EPSG:4326');
      var maxBox = ol.proj.transform([currentView[2], currentView[3]],
          mapService_.map.getView().getProjection(), 'EPSG:4326');
      currentView[0] = minBox[0];
      currentView[1] = minBox[1];
      currentView[2] = maxBox[0];
      currentView[3] = maxBox[1];
      var promise = q_.defer();
      var url;

      // Check which to handle
      if (configService_.configuration.nominatimSearchEnabled === true) {
        var nominatimUrl = configService_.configuration.searchUrl;
        if (nominatimUrl.substr(nominatimUrl.length - 1) === '/') {
          nominatimUrl = nominatimUrl.substr(0, nominatimUrl.length - 1);
        }
        httpService_({
          method: 'GET',
          url: nominatimUrl,
          params: {
            q: address,
            format: 'json',
            limit: 30,
            viewobxlbrt: currentView.toString()
          }
        }).then(function(response) {
          if (goog.isDefAndNotNull(response.data) && goog.isArray(response.data)) {
            var results = [];
            var features = [
    { "type": "Feature",
      "geometry": {
          "type": "Point",
          "coordinates": [-88.433333,17.983333]
      },
      "properties": {
          "name": "London",
          "cc": "BH",
          "featureDesignationCode": "PPL",
          "featureDesignationName": "populated place",
          "location": "175900N 0882600W",
          "dateLastChanged": "1993/12/18",
          "source": "GeoNames"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [96.288538,25.092285]
      },
      "properties": {
        "name": "Lôndôn",
        "cc": "BM",
        "featureDesignationCode": "PPL",
        "featureDesignationName": "populated place",
        "location": "250532N 0961719E",
        "dateLastChanged": "2012/11/14",
        "source": "GeoNames"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [30.572504,-24.302623]
      },
      "properties": {
        "name": "London",
        "cc": "SF",
        "featureDesignationCode": "PPL",
        "featureDesignationName": "populated place",
        "location": "241809S 0303421E",
        "dateLastChanged": "2011/03/15",
        "source": "GeoNames"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [31.047653,-24.819267]
      },
      "properties": {
        "name": "London",
        "cc": "SF",
        "featureDesignationCode": "PPL",
        "featureDesignationName": "populated place",
        "location": "244909S 0310252E",
        "dateLastChanged": "2011/02/25",
        "source": "GeoNames"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [9.789344,2.26815]
      },
      "properties": {
        "name": "London",
        "cc": "EK",
        "featureDesignationCode": "PPL",
        "featureDesignationName": "populated place",
        "location": "021605N 0094722E",
        "dateLastChanged": "2011/02/25",
        "source": "GeoNames"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [75.964428,31.52749]
      },
      "properties": {
        "name": "London",
        "cc": "IN",
        "featureDesignationCode": "PPL",
        "featureDesignationName": "populated place",
        "location": "313139N 0755752E",
        "dateLastChanged": "2015/03/19",
        "source": "GeoNames"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-157.466667,1.983333]
      },
      "properties": {
        "name": "London",
        "cc": "KR",
        "featureDesignationCode": "PPL",
        "featureDesignationName": "populated place",
        "location": "015900N 1572800W",
        "dateLastChanged": "1993/12/22",
        "source": "GeoNames"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-10.845472,8.600019]
      },
      "properties": {
        "name": "London",
        "cc": "SL",
        "featureDesignationCode": "PPL",
        "featureDesignationName": "populated place",
        "location": "083600N 0105044W",
        "dateLastChanged": "2015/01/07",
        "source": "GeoNames"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-10.78731,8.310679]
      },
      "properties": {
        "name": "London",
        "cc": "SL",
        "featureDesignationCode": "PPL",
        "featureDesignationName": "populated place",
        "location": "081838N 0104714W",
        "dateLastChanged": "2014/11/14",
        "source": "GeoNames"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-12.00293,7.651372]
      },
      "properties": {
        "name": "London",
        "cc": "SL",
        "featureDesignationCode": "PPL",
        "featureDesignationName": "populated place",
        "location": "073905N 0120011W",
        "dateLastChanged": "2014/11/06",
        "source": "GeoNames"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [5.787874,5.722571]
      },
      "properties": {
        "name": "London",
        "cc": "NI",
        "featureDesignationCode": "PPL",
        "featureDesignationName": "populated place",
        "location": "054321N 0054716E",
        "dateLastChanged": "2009/05/15",
        "source": "GeoNames"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-81.25,42.983333]
      },
      "properties": {
        "name": "London",
        "cc": "CA",
        "featureDesignationCode": "PPL",
        "featureDesignationName": "populated place",
        "location": "425900N 0811500W",
        "dateLastChanged": "1993/12/14",
        "source": "GeoNames"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-0.093145,51.514248]
      },
      "properties": {
        "name": "London",
        "cc": "UK",
        "featureDesignationCode": "PPLC",
        "featureDesignationName": "capital of a political entity",
        "location": "513051N 0000535W",
        "dateLastChanged": "2010/01/29",
        "source": "GeoNames"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [125.129444,6.009722]
      },
      "properties": {
        "name": "London",
        "cc": "RP",
        "featureDesignationCode": "PPL",
        "featureDesignationName": "populated place",
        "location": "060035N 1250746E",
        "dateLastChanged": "2004/03/11",
        "source": "GeoNames"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [30.866667,-24.766667]
      },
      "properties": {
        "name": "London",
        "cc": "SF",
        "featureDesignationCode": "PPL",
        "featureDesignationName": "populated place",
        "location": "244600S 0305200E",
        "dateLastChanged": "2004/05/11",
        "source": "GeoNames"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-0.093689,51.514125]
      },
      "properties": {
        "name": "London",
        "cc": "UK",
        "featureDesignationCode": "ADM1",
        "featureDesignationName": "first-order administrative division",
        "location": "513051N 0000537W",
        "dateLastChanged": "2010/01/29",
        "source": "GeoNames"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [26.304076,-27.731408]
      },
      "properties": {
        "name": "London",
        "cc": "SF",
        "featureDesignationCode": "FRM",
        "featureDesignationName": "farm(s)",
        "location": "274353S 0261815E",
        "dateLastChanged": "2011/03/07",
        "source": "GeoNames"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [26.294534,-27.719277]
      },
      "properties": {
        "name": "London",
        "cc": "SF",
        "featureDesignationCode": "FRM",
        "featureDesignationName": "farm(s)",
        "location": "274309S 0261740E",
        "dateLastChanged": "2011/03/07",
        "source": "GeoNames"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [26.802255,-24.768017]
      },
      "properties": {
        "name": "London",
        "cc": "SF",
        "featureDesignationCode": "FRM",
        "featureDesignationName": "farm(s)",
        "location": "244605S 0264808E",
        "dateLastChanged": "2011/03/15",
        "source": "GeoNames"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [30.604536,-24.297762]
      },
      "properties": {
        "name": "London",
        "cc": "SF",
        "featureDesignationCode": "FRM",
        "featureDesignationName": "farm(s)",
        "location": "241752S 0303616E",
        "dateLastChanged": "2011/03/15",
        "source": "GeoNames"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [25.856467,-29.47738]
      },
      "properties": {
        "name": "London",
        "cc": "SF",
        "featureDesignationCode": "FRM",
        "featureDesignationName": "farm(s)",
        "location": "292839S 0255123E",
        "dateLastChanged": "2011/07/07",
        "source": "GeoNames"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [25.386449,-27.351234]
      },
      "properties": {
        "name": "London",
        "cc": "SF",
        "featureDesignationCode": "FRM",
        "featureDesignationName": "farm(s)",
        "location": "272104S 0252311E",
        "dateLastChanged": "2011/07/07",
        "source": "GeoNames"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [23.04504,-27.239682]
      },
      "properties": {
        "name": "London",
        "cc": "SF",
        "featureDesignationCode": "FRM",
        "featureDesignationName": "farm(s)",
        "location": "271423S 0230242E",
        "dateLastChanged": "2011/07/07",
        "source": "GeoNames"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [12.090264,78.963356]
      },
      "properties": {
        "name": "London",
        "cc": "SV",
        "featureDesignationCode": "CMP",
        "featureDesignationName": "camp(s)",
        "location": "785748N 0120525E",
        "dateLastChanged": "2011/03/30",
        "source": "GeoNames"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-66.731587,10.360929]
      },
      "properties": {
        "name": "London",
        "cc": "VE",
        "featureDesignationCode": "PPLL",
        "featureDesignationName": "populated locality",
        "location": "102139N 0664354W",
        "dateLastChanged": "2011/08/25",
        "source": "GeoNames"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [32.583333,-18.383333]
      },
      "properties": {
        "name": "London",
        "cc": "ZI",
        "featureDesignationCode": "FRM",
        "featureDesignationName": "farm(s)",
        "location": "182300S 0323500E",
        "dateLastChanged": "1994/01/08",
        "source": "GeoNames"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [6.016667,46.166667]
      },
      "properties": {
        "name": "London",
        "cc": "FR,SZ",
        "cc2": "FR",
        "featureDesignationCode": "STM",
        "featureDesignationName": "stream(s)",
        "location": "461000N 0060100E",
        "dateLastChanged": "2014/07/03",
        "source": "GeoNames"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-81.151429,43.035344]
      },
      "properties": {
        "name": "London",
        "cc": "CA",
        "featureDesignationCode": "AIRP",
        "featureDesignationName": "airport",
        "location": "430207N 0810905W",
        "dateLastChanged": "2012/10/04",
        "source": "GeoNames"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [121.021326,14.501531]
      },
      "properties": {
        "name": "London",
        "cc": "RP",
        "featureDesignationCode": "ST",
        "featureDesignationName": "street",
        "location": "143006N 1210117E",
        "dateLastChanged": "2013/05/08",
        "source": "GeoNames"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [120.975524,14.327373]
      },
      "properties": {
        "name": "London",
        "cc": "RP",
        "featureDesignationCode": "ST",
        "featureDesignationName": "street",
        "location": "141939N 1205832E",
        "dateLastChanged": "2013/07/30",
        "source": "GeoNames"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [121.095138,14.607079]
      },
      "properties": {
        "name": "London",
        "cc": "RP",
        "featureDesignationCode": "ST",
        "featureDesignationName": "street",
        "location": "143625N 1210542E",
        "dateLastChanged": "2013/04/30",
        "source": "GeoNames"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [120.951665,14.323065]
      },
      "properties": {
        "name": "London",
        "cc": "RP",
        "featureDesignationCode": "ST",
        "featureDesignationName": "street",
        "location": "141923N 1205706E",
        "dateLastChanged": "2013/07/30",
        "source": "GeoNames"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [120.935173,14.346697]
      },
      "properties": {
        "name": "London",
        "cc": "RP",
        "featureDesignationCode": "ST",
        "featureDesignationName": "street",
        "location": "142048N 1205607E",
        "dateLastChanged": "2013/07/29",
        "source": "GeoNames"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [28.8,-24.566667]
      },
      "properties": {
        "name": "London",
        "cc": "SF",
        "featureDesignationCode": "AIRF",
        "featureDesignationName": "airfield",
        "location": "243400S 0284800E",
        "dateLastChanged": "2004/05/11",
        "source": "GeoNames"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [31.133333,-24.116667]
      },
      "properties": {
        "name": "London",
        "cc": "SF",
        "featureDesignationCode": "FRM",
        "featureDesignationName": "farm(s)",
        "location": "240700S 0310800E",
        "dateLastChanged": "2004/05/11",
        "source": "GeoNames"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [31.027222,-24.812451]
      },
      "properties": {
        "name": "London",
        "cc": "SF",
        "featureDesignationCode": "FRM",
        "featureDesignationName": "farm(s)",
        "location": "244845S 0310138E",
        "dateLastChanged": "2011/02/25",
        "source": "GeoNames"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [30.839335,-24.782489]
      },
      "properties": {
        "name": "London",
        "cc": "SF",
        "featureDesignationCode": "FRM",
        "featureDesignationName": "farm(s)",
        "location": "244657S 0305022E",
        "dateLastChanged": "2011/02/25",
        "source": "GeoNames"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [28.818108,-24.585605]
      },
      "properties": {
        "name": "London",
        "cc": "SF",
        "featureDesignationCode": "FRM",
        "featureDesignationName": "farm(s)",
        "location": "243508S 0284905E",
        "dateLastChanged": "2011/02/28",
        "source": "GeoNames"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [27.180274,-27.148999]
      },
      "properties": {
        "name": "London",
        "cc": "SF",
        "featureDesignationCode": "FRM",
        "featureDesignationName": "farm(s)",
        "location": "270856S 0271049E",
        "dateLastChanged": "2011/02/28",
        "source": "GeoNames"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [26.788549,-24.32523]
      },
      "properties": {
        "name": "London",
        "cc": "SF",
        "featureDesignationCode": "FRM",
        "featureDesignationName": "farm(s)",
        "location": "241931S 0264719E",
        "dateLastChanged": "2011/03/14",
        "source": "GeoNames"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [28.580174,-22.703383]
      },
      "properties": {
        "name": "London",
        "cc": "SF",
        "featureDesignationCode": "FRM",
        "featureDesignationName": "farm(s)",
        "location": "224212S 0283449E",
        "dateLastChanged": "2011/03/11",
        "source": "GeoNames"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [28.59432,-22.687953]
      },
      "properties": {
        "name": "London",
        "cc": "SF",
        "featureDesignationCode": "FRM",
        "featureDesignationName": "farm(s)",
        "location": "224117S 0283540E",
        "dateLastChanged": "2011/03/11",
        "source": "GeoNames"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-93.0640856,43.5257951]
      },
      "properties": {
        "name": "London",
        "county": "Freeborn",
        "state": "MN",
        "featureClass": "Locale",
        "location": "433133N 0930351W",
        "source": "GNIS"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-81.3687243,38.1945491]
      },
      "properties": {
        "name": "London",
        "county": "Kanawha",
        "state": "WV",
        "featureClass": "Populated Place",
        "location": "381140N 0812207W",
        "source": "GNIS"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-87.0877517,31.2976707]
      },
      "properties": {
        "name": "London",
        "county": "Conecuh",
        "state": "AL",
        "featureClass": "Populated Place",
        "location": "311752N 0870516W",
        "source": "GNIS"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-86.0502371,32.2731979]
      },
      "properties": {
        "name": "London",
        "county": "Montgomery",
        "state": "AL",
        "featureClass": "Populated Place",
        "location": "321624N 0860301W",
        "source": "GNIS"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-93.2529553,35.328973]
      },
      "properties": {
        "name": "London",
        "county": "Pope",
        "state": "AR",
        "featureClass": "Populated Place",
        "location": "351944N 0931511W",
        "source": "GNIS"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-119.4431785,36.4760619]
      },
      "properties": {
        "name": "London",
        "county": "Tulare",
        "state": "CA",
        "featureClass": "Populated Place",
        "location": "362834N 1192635W",
        "source": "GNIS"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-85.9202594,39.625602]
      },
      "properties": {
        "name": "London",
        "county": "Shelby",
        "state": "IN",
        "featureClass": "Populated Place",
        "location": "393732N 0855513W",
        "source": "GNIS"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-84.0832646,37.1289771]
      },
      "properties": {
        "name": "London",
        "county": "Laurel",
        "state": "KY",
        "featureClass": "Populated Place",
        "location": "370744N 0840500W",
        "source": "GNIS"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-83.6132701,42.0200442]
      },
      "properties": {
        "name": "London",
        "county": "Monroe",
        "state": "MI",
        "featureClass": "Populated Place",
        "location": "420112N 0833648W",
        "source": "GNIS"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-93.0626967,43.5260729]
      },
      "properties": {
        "name": "London",
        "county": "Freeborn",
        "state": "MN",
        "featureClass": "Populated Place",
        "location": "433134N 0930346W",
        "source": "GNIS"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-91.5696169,47.2027037]
      },
      "properties": {
        "name": "London",
        "county": "Lake",
        "state": "MN",
        "featureClass": "Populated Place",
        "location": "471210N 0913411W",
        "source": "GNIS"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-95.2349777,40.4449952]
      },
      "properties": {
        "name": "London",
        "county": "Atchison",
        "state": "MO",
        "featureClass": "Populated Place",
        "location": "402642N 0951406W",
        "source": "GNIS"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-82.6293412,40.9103338]
      },
      "properties": {
        "name": "London",
        "county": "Richland",
        "state": "OH",
        "featureClass": "Populated Place",
        "location": "405437N 0823746W",
        "source": "GNIS"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-83.448253,39.8864493]
      },
      "properties": {
        "name": "London",
        "county": "Madison",
        "state": "OH",
        "featureClass": "Populated Place",
        "location": "395311N 0832654W",
        "source": "GNIS"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-123.0928535,43.6345656]
      },
      "properties": {
        "name": "London",
        "county": "Lane",
        "state": "OR",
        "featureClass": "Populated Place",
        "location": "433804N 1230534W",
        "source": "GNIS"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-80.1486716,41.1436709]
      },
      "properties": {
        "name": "London",
        "county": "Mercer",
        "state": "PA",
        "featureClass": "Populated Place",
        "location": "410837N 0800855W",
        "source": "GNIS"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-83.002092,35.8698226]
      },
      "properties": {
        "name": "London",
        "county": "Cocke",
        "state": "TN",
        "featureClass": "Populated Place",
        "location": "355211N 0830008W",
        "source": "GNIS"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-99.5764516,30.6768485]
      },
      "properties": {
        "name": "London",
        "county": "Kimble",
        "state": "TX",
        "featureClass": "Populated Place",
        "location": "304037N 0993435W",
        "source": "GNIS"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-89.0128881,43.0477775]
      },
      "properties": {
        "name": "London",
        "county": "Dane",
        "state": "WI",
        "featureClass": "Populated Place",
        "location": "430252N 0890046W",
        "source": "GNIS"
      }
    },
    { "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-94.9443839,32.2309892]
      },
      "properties": {
        "name": "London",
        "county": "Rusk",
        "state": "TX",
        "featureClass": "Populated Place",
        "location": "321352N 0945640W",
        "source": "GNIS"
      }
    }
];
            forEachArrayish(features, function(result) {
              results.push({
                location: [parseFloat(result.geometry.coordinates[0]), parseFloat(result.geometry.coordinates[1])],
                boundingbox: convertLatLonToBbox(result.geometry.coordinates),
                name: result.properties.name,
                cc: result.properties.cc,
                source: result.properties.source,
                featureDesignationName: result.properties.featureDesignationName,
                featureDesignationCode: result.properties.featureDesignationCode
              });
            });
            /*
            forEachArrayish(response.data, function(result) {
              var bbox = result.boundingbox;
              for (var i = 0; i < bbox.length; i++) {
                bbox[i] = parseFloat(bbox[i]);
              }
              results.push({
                location: [parseFloat(result.lon), parseFloat(result.lat)],
                boundingbox: bbox,
                name: result.display_name
              });
            });
*/
            promise.resolve(results);
          } else {
            promise.reject(response.status);
          }
        }, function(reject) {
          promise.reject(reject.status);
        });
      } else if (configService_.configuration.geoquerySearchEnabled === true) {
        var geoqueryUrl = configService_.configuration.searchUrl;
        if (geoqueryUrl.substr(geoqueryUrl.length - 1) === '/') {
          geoqueryUrl = geoqueryUrl.substr(0, geoqueryUrl.length - 1);
        }
        httpService_({
          method: 'GET',
          url: geoqueryUrl + '/wfs',
          params: {
            request: 'GetFeature',
            service: 'WFS',
            version: '1.1.0',
            typename: 'all',
            filter: '<PropertyIsEqualTo><PropertyName>query</PropertyName><Literal>' +
                address + '</Literal></PropertyIsEqualTo>',
            bbox: currentView.toString(),
            outputFormat: 'json'
          }
        }).then(function(response) {
          if (goog.isDefAndNotNull(response.data.features) && goog.isArray(response.data.features)) {
            var results = [];
            forEachArrayish(response.data.features, function(result) {
              results.push({
                location: [parseFloat(result.geometry.coordinates[0]), parseFloat(result.geometry.coordinates[1])],
                boundingbox: convertLatLonToBbox(result.geometry.coordinates),
                name: result.properties.name,
                cc: result.properties.cc,
                source: result.properties.source,
                featureDesignationName: result.properties.featureDesignationName,
                featureDesignationCode: result.properties.featureDesignationCode
              });
            });
            promise.resolve(results);
          } else {
            promise.reject(response.status);
          }
        }, function(reject) {
          promise.reject(reject.status);
        });
      } else {
        // default to using osm method
        var searchUrl = configService_.configuration.searchUrl;
        if (searchUrl.substr(searchUrl.length - 1) === '/') {
          searchUrl = searchUrl.substr(0, searchUrl.length - 1);
        }
        httpService_({
          method: 'GET',
          url: searchUrl,
          params: {
            q: address,
            format: 'json',
            limit: 30,
            viewobxlbrt: currentView.toString()
          }
        }).then(function(response) {
          if (goog.isDefAndNotNull(response.data) && goog.isArray(response.data)) {
            var results = [];
            forEachArrayish(response.data, function(result) {
              var bbox = result.boundingbox;
              for (var i = 0; i < bbox.length; i++) {
                bbox[i] = parseFloat(bbox[i]);
              }
              results.push({
                location: [parseFloat(result.lon), parseFloat(result.lat)],
                boundingbox: bbox,
                name: result.display_name
              });
            });
            promise.resolve(results);
          } else {
            promise.reject(response.status);
          }
        }, function(reject) {
          promise.reject(reject.status);
        });
      }

      return promise.promise;
    };

    this.populateSearchLayer = function(results) {
      searchlayer_.getSource().clear();
      mapService_.map.removeLayer(searchlayer_);
      mapService_.map.addLayer(searchlayer_);
      forEachArrayish(results, function(result) {
        var olFeature = new ol.Feature();
        olFeature.setGeometry(new ol.geom.Point(ol.proj.transform(result.location, 'EPSG:4326',
            mapService_.map.getView().getProjection())));
        searchlayer_.getSource().addFeature(olFeature);
      });
    };

    this.clearSearchLayer = function() {
      searchlayer_.getSource().clear();
      mapService_.map.removeLayer(searchlayer_);
    };
  });
}());
