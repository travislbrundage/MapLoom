describe('FeatureInfoBoxDirective', function() {
  var featureMgrService, mapService, scope, element, compiledElement;

  //include the whole application to initialize all services and modules
  beforeEach(module('MapLoom'));
  //beforeEach(module('loom_feature_manager'));
  beforeEach(module('featuremanager/partial/featureinfobox.tpl.html'));

  beforeEach(inject(function ($rootScope, $compile, _featureManagerService_, _mapService_) {
    featureMgrService = _featureManagerService_;
    mapService = _mapService_;
    scope = $rootScope.$new();
    element = angular.element('<div id="loom-feature-info-box"></div>');
    compiledElement = $compile(element)(scope);
    scope.$digest();

    spyOn(featureMgrService, 'getSelectedItem').and.returnValue({layer:mapService.map.getLayers().array_[0]});
  }));

  describe('pinFeature', function() {
    it('should add features to the searchResults layer', function() {
      // will this need any data or is this enough?
      var mock_feature = new ol.Feature();
      mock_feature.setId('mock_feature');
      element.scope().pinFeature();

      // expect mapservice map to contain selectedLayer which contains selected item
      var searchResults;
      mapService.map.getLayers().forEach(function(layer) {
        if (layer.get('metadata').searchResults) {
          searchResults = layer;
        }
      });
      expect(searchResults).toBeDefined();
      console.info(featureMgrService.getSelectedItem());
      expect(searchResults.getSource().getFeatureById(featureMgrService.getSelectedItem().getId())).toBeDefined();
    });
  });

  describe('unpinFeature', function() {
    it('should remove features from the searchResults layer', function() {
      // TODO: Make mock feature to assign here
      featureMgrService.selectedItem_ = new ol.Feature();
      featureMgrService.selectedItem_.setId('mock_feature');
      element.scope().pinFeature();
      // TODO: Make mock feature to assign here
      featureMgrService.selectedItem_ = new ol.Feature();
      featureMgrService.selectedItem_.setId('mock_feature2');
      element.scope().pinFeature();

      // expect mapservice map to contain selectedLayer which contains selected item
      var searchResults;
      mapService.map.getLayers().forEach(function(layer) {
        if (layer.get('metadata').searchResults) {
          searchResults = layer;
        }
      });
      expect(searchResults).toBeDefined();
      expect(searchResults.getSource().getFeatureById(featureMgrService.selectedItem_.getId())).toBeDefined();

      element.scope().unpinFeature();
      expect(searchResults.getSource().getFeatureById(featureMgrService.selectedItem_.getId())).not.toBeDefined();
    });
  });
});
