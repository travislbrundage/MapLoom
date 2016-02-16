(function() {
  var module = angular.module('loom_story_service', ['ngCookies']);
  var service_ = null;
  var mapservice_ = null;
  var configService_ = null;
  var httpService_ = null;
  var dialogService_ = null;


  module.provider('storyService', function() {

    this.$get = function($window, $http, $cookies, $location, $translate, mapService, configService, dialogService) {
      service_ = this;
      mapservice_ = mapService;
      configService_ = configService;
      httpService_ = $http;
      dialogService_ = dialogService;

      //When initializing the story service the mapService should already be initialized
      this.title = 'New Mapstory';
      this.abstract = 'This is the default summary';
      this.category = null;
      this.is_published = false;
      //Stores the list of chapter (map) configuration objects and uses mapService to save map based on config
      this.configurations = [];
      this.removedChapterIDs = [];
      this.configurations.push(angular.copy(mapservice_.configuration));
      this.active_index = 0;
      //All mapstories have one default chapter added
      this.active_chapter = this.configurations[this.active_index];
      this.active_chapter.map['id'] = 0;
      this.active_chapter.about.title = 'Untitled Chapter';
      this.active_chapter.about.abstract = 'This is the default summary';
      console.log('-----story_config:', this.active_chapter);
      this.id = this.active_chapter.id;
      this.category = null;
      this.is_published = false;
      this.keywords = [];

      return this;
    };

    //Save all chapter configuration objects
    this.saveMaps = function() {
      //Go through each chapter configuration and save accordingly through mapService
      for (var iConfig = 0; iConfig < this.configurations.length; iConfig += 1) {
        //Chapter index is determined by order in configuration
        service_.configurations[iConfig]['chapter_index'] = iConfig;
        mapservice_.save(this.configurations[iConfig]);
      }
      this.print_configurations();
    };

    //Method saves mapstory and underlying chapters
    this.save = function() {
      var cfg = {
        id: this.id || 0,
        title: this.title,
        abstract: this.abstract,
        is_published: this.is_published,
        category: this.category,
        removed_chapters: this.removedChapterIDs
      };

      console.log('saving new Mapstory');
      httpService_({
        url: service_.getSaveURL(),
        method: service_.getSaveHTTPMethod(),
        data: JSON.stringify(cfg),
        headers: {
          'X-CSRFToken': configService_.csrfToken
        }
      }).success(function(data, status, headers, config) {
        //After we successfully save a mapstory update the composer to reference the backend object
        //and save chapters
        service_.updateStoryID(data.id);
        service_.saveMaps();
        console.log('----[ mapstory.save success. ', data, status, headers, config);
      }).error(function(data, status, headers, config) {
        if (status == 403 || status == 401) {
          dialogService_.error(translate_.instant('save_failed'), translate_.instant('mapstory_save_permission'));
        } else {
          dialogService_.error(translate_.instant('save_failed'), translate_.instant('mapstory_save_failed',
              {value: status}));
        }
      });

    };

    this.updateStoryID = function(id) {
      this.id = id;
      for (var iConfig = 0; iConfig < this.configurations.length; iConfig += 1) {
        this.configurations[iConfig].id = id;
      }
    };

    this.getSaveURL = function() {
      if (goog.isDefAndNotNull(this.id) && this.id) {
        return '/maps/' + this.id + '/save';
      } else {
        return '/maps/new/story';
      }
    };

    this.getSaveHTTPMethod = function() {
      if (goog.isDefAndNotNull(this.id) && this.id) {
        return 'PUT';
      } else {
        return 'POST';
      }
    };

    this.print_configurations = function() {
      console.log('=====configurations======');
      for (var iConfig = 0; iConfig < this.configurations.length; iConfig += 1) {
        console.log('configuration ', iConfig, this.configurations[iConfig]);
      }
    };

    this.get_chapter_config = function(index) {
      return this.configurations[index];
    };

    //Composer only allows you to edit one chapter at a time
    //This function should be called whenever we select a different chapter from the list.
    this.update_active_config = function(index) {
      //This function updates the active_chapter and propagates the new
      //active configuration to the other services.
      if (this.active_index === index) {
        return;
      }
      this.active_chapter = this.configurations[index];
      this.active_index = index;

      mapservice_.updateActiveMap(this.active_index, this.active_chapter);
    };

    //Updates the stored chapter_info information for the current chapter
    //Does not invoke a map save
    this.update_chapter_info = function(chapter_info) {

      this.active_chapter.about.title = chapter_info.chapter_title;
      this.active_chapter.about.abstract = chapter_info.abstract;
    };

    this.change_chapter = function(chapter_index) {
      service_.update_active_config(chapter_index);
    };

    this.next_chapter = function() {
      var nextChapter = this.active_index + 1;
      if (nextChapter > this.configurations.length - 1) {
        nextChapter = 0;
      }
      service_.update_active_config(nextChapter);
    };

    this.prev_chapter = function() {
      var prevChapter = this.active_index - 1;
      if (prevChapter < 0) {
        prevChapter = 0;
      }
      service_.update_active_config(prevChapter);
    };

    this.add_chapter = function($scope, $compile) {
      //The config service is the entrypoint and contains the initial configuration for a chapter
      var new_chapter = angular.copy(configService_.initial_config);
      new_chapter['id'] = this.id;
      new_chapter.map['id'] = 0;
      new_chapter.about.title = 'Untitled Chapter';
      new_chapter.about.summary = '';
      this.configurations.push(new_chapter);
      //This creates the new layergroup on the open layers map that is being displayed.
      //Parameter is currently unused, but may be changed if we decide map load should occur here.
      mapservice_.create_chapter(new_chapter);
      var new_index = (this.configurations.length - 1);
      //Immediately set focus to new chapter after creation. This causes the new chapter map to load
      service_.update_active_config(new_index);
      this.print_configurations();

      return new_index;

    };

    this.remove_chapter = function() {
      //If the chapter map has been saved beforehand we need to remove that chapter link
      map_id = this.configurations[this.active_index].map.id;
      if (map_id !== 0) {
        this.removedChapterIDs.push(map_id);
      }

      //Remove the active chapter from the list of configurations
      this.configurations.splice(this.active_index, 1);
      if (this.configurations.length > 0) {
        this.update_active_config(0);
      }

      // Angular bindings will update to reflect the above change, so just delete the last chapter in the UI
      // TODO: Get rid of the +1 at some point when we start with a Chapter 1.
      $(('#chapter' + (this.configurations.length + 1))).remove();

      // Switch focus to base level of menu
      $('#menu').multilevelpushmenu('collapse', 0);
    };

  });

}());
