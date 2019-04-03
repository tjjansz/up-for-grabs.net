// @ts-nocheck

define([
  "jquery",
  "projectsService",
  "underscore",
  "sammy",
  // chosen is listed here as a dependency because it's used from a jQuery
  // selector, and needs to be ready before this code runs
  "chosen",
], ($, ProjectsService, _, sammy) => {
  var projectsSvc = new ProjectsService(projects),
    compiledtemplateFn = null,
    projectsPanel = null;

  var getFilterUrl = function() {
    return location.href.indexOf("/#/filters") > -1
      ? location.href
      : location.href + "filters";
  };



  //takes in list of project objects, searches list of objects for value
  //list: list of project objects
  //value: string of project name
  //returns index of value in list, returns -1 if not found
  function binarySearch(list, value) {
      // initial values for start, middle and end
      value = value.toLowerCase()
      let start = 0
      let stop = list.length - 1
      let middle = Math.floor((start + stop) / 2)

      // While the middle is not what we're looking for and the list does not have a single item
      while (list[middle].name.toLowerCase() !== value && start < stop) {
          if (value < list[middle].name.toLowerCase()) {
              stop = middle - 1
          } else {
              start = middle + 1
          }
          // recalculate middle on every iteration
          middle = Math.floor((start + stop) / 2)
      }
      // if the current middle item is what we're looking for return it's index, else return -1
      return (list[middle].name.toLowerCase() !== value) ? -1 : middle
  }



  //takes list of tags (strings) E.g. [".net", "2d"] and resolves them to indexes in projectSvcs list
  //tags: String list
  //returns list of numbers
  function resolveTagtoIndexes(tags) {
      var list = [];

      //temp stores list of ~1300 project objects in list
      var temp = projectsSvc.getTags()

      if (tags == undefined) {
          tags = []
      }

      for (var i = 0; i < tags.length; i++) {
          var index = binarySearch(temp, tags[i]);
          if (index != -1) {
              list.push(index);
          }
      }
      return list;
  }

//creates list of tags (strings) E.g. [".net", "2d"] from items currently selected in tag input field
//curSelection: list of numbers corresponding to indexes in tag input field
//return list of strings
function createTagList(curSelections) {
    var tagList = [];

    //temp stores list of ~1300 project objects in list
    var temp = projectsSvc.getTags()

    if (curSelections == undefined || curSelections == null || curSelections.length == 0) {
        return [""];
    }
    else {
        for (var i = 0; i < curSelections.length; i++) {
            tagList.push(temp[curSelections[i]].name);
        }
    }
    return tagList;
}



  var renderProjects = function(tags, names, labels) {
    console.log("RENDER");
    var listIndexes = resolveTagtoIndexes(tags)
    projectsPanel.html(
      compiledtemplateFn({
        projects: projectsSvc.get(tags, names, labels),
        tags: projectsSvc.getTags(),
        popularTags: projectsSvc.getPopularTags(6),
        selectedTags: tags,
        names: projectsSvc.getNames(),
        selectedNames: names,
        labels: projectsSvc.getLabels(),
        selectedLabels: labels,
      })
    );

    projectsPanel
      .find("select.tags-filter")
      .chosen({
        no_results_text: "No tags found by that name.",
        width: "95%",
      })
      .val(listIndexes)
      .trigger("chosen:updated")
      .change(function() {
        console.log($(this).val());
        var tagList = createTagList($(this).val(),listIndexes);
        console.log(tagList);
        location.href = updateQueryStringParameter(
          getFilterUrl(),
          "tags",
        encodeURIComponent(tagList || "")
      // encodeURIComponent($(this).val() || "")

        );
      });

    projectsPanel
      .find("select.names-filter")
      .chosen({
        search_contains: true,
        no_results_text: "No project found by that name.",
        width: "95%",
      })
      .val(names)
      .trigger("chosen:updated")
      .change(function() {
        console.log($(this).val());
        location.href = updateQueryStringParameter(
          getFilterUrl(),
          "names",

          encodeURIComponent($(this).val() || "")
        );
      });

    projectsPanel
      .find("select.labels-filter")
      .chosen({
        no_results_text: "No project found by that label.",
        width: "95%",
      })
      .val(labels)
      .trigger("chosen:updated")
      .change(function() {
        location.href = updateQueryStringParameter(
          getFilterUrl(),
          "labels",
          encodeURIComponent($(this).val() || "")
        );
      });

    projectsPanel
      .find("ul.popular-tags")
      .children()
      .each(function(i, elem) {
        $(elem).on("click", function() {
          selTags = $(".tags-filter").val() || [];
          selectedTag = preparePopTagName($(this).text() || "");
          if (selectedTag) {
            selTags.push(selectedTag);
            location.href = updateQueryStringParameter(
              getFilterUrl(),
              "tags",
              encodeURIComponent(selTags)
            );
          }
        });
      });
  };

  /*
    This is a utility method to help update a list items Name parameter to make
    it fit URL specification
    @return string - The value of the Name
  */
  var preparePopTagName = function(name) {
    if (name === "") return "";
    return name.toLowerCase().split(" ")[0];
  };

  /**
   * This is a utility method to help update URL Query Parameters
   * @return string - The value of the URL when adding/removing values to it.
   */
  var updateQueryStringParameter = function(uri, key, value) {
    var re = new RegExp("([?&])" + key + "=.*?(&|$)", "i");
    var separator = uri.indexOf("?") !== -1 ? "&" : "?";
    if (uri.match(re)) {
      return uri.replace(re, "$1" + key + "=" + value + "$2");
    }

    return uri + separator + key + "=" + value;
  };

  /**
   * This function help getting all params in url queryString
   * Taken from here
   * https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
   *
   * @return string - value of url params
   */
  var getParameterByName = function(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return "";
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  };

  /**
   * This function adds a button to scroll to top
   * after navigating through a certain screen length
   * Also has corresponding fade-in and fade-out fetaure
   */
  $(window).scroll(function() {
    var height = $(window).scrollTop();
    if (height > 100) {
      $("#back2Top").fadeIn();
    } else {
      $("#back2Top").fadeOut();
    }
  });
  $(document).ready(function() {
    $("#back2Top").click(function(event) {
      event.preventDefault();
      $("html, body").animate({ scrollTop: 0 }, "slow");
      return false;
    });
  });

  /*
   * This is a helper method that prepares the chosen labels/tags/names
   * For HTML and helps display the selected values of each
   * @params String text - The text given, indices or names. As long as it is a string
   * @return Array - Returns an array of splitted values if given a text. Otherwise undefined
   */
  var prepareForHTML = function(text) {
    return text ? text.toLowerCase().split(",") : text;
  };

  var app = sammy(function() {
    /*
     * This is the route used to filter by tags/names/labels
     * It ensures to read values from the URI query param and perform actions
     * based on that. NOTE: It has major side effects on the browser.
     */
    this.get("#/filters", function() {
      var labels = prepareForHTML(getParameterByName("labels"));
      var names = prepareForHTML(getParameterByName("names"));
      var tags = prepareForHTML(getParameterByName("tags"));
      console.log(tags);
      renderProjects(tags, names, labels);
    });

    this.get("#/", function() {
      renderProjects();
    });
  });

  var storage = (function(global) {
    function set(name, value) {
      try {
        if (typeof global.localStorage !== "undefined") {
          global.localStorage.setItem(name, JSON.stringify(value));
        }
      } catch (exception) {
        if (
          exception != QUOTA_EXCEEDED_ERR &&
          exception != NS_ERROR_DOM_QUOTA_REACHED
        ) {
          throw exception;
        }
      }
    }

    function get(name) {
      if (typeof global.localStorage !== "undefined") {
        return JSON.parse(global.localStorage.getItem(name));
      }
      return undefined;
    }

    return {
      set: set,
      get: get,
    };
  })(window);

  var issueCount = function(project) {
    var a = $(project).find(".label a"),
      gh = a
        .attr("href")
        .match(/github.com(\/[^\/]+\/[^\/]+\/)(?:issues\/)?labels\/([^\/]+)$/),
      url =
        gh && "https://api.github.com/repos" + gh[1] + "issues?labels=" + gh[2],
      count = a.find(".count");

    if (count.length) {
      return;
    }

    if (!gh) {
      count = $(
        /* eslint-disable-next-line quotes */
        '<span class="count" title="Issue count is only available for projects on GitHub.">?</span>'
      ).appendTo(a);
      return;
    }

    count = $(
      /* eslint-disable-next-line quotes */
      '<span class="count"><img src="images/octocat-spinner-32.gif" /></span>'
    ).appendTo(a);
    var cached = storage.get(gh[1]);
    if (
      cached &&
      cached.date &&
      new Date(cached.date) >= new Date() - 1000 * 60 * 60 * 24
    ) {
      count.html(cached.count);
      return;
    }

    $.ajax(url)
      .done(function(data) {
        var resultCount =
          data && typeof data.length === "number"
            ? data.length.toString()
            : "?";
        count.html(resultCount);
        storage.set(gh[1], {
          count: resultCount,
          date: new Date(),
        });
      })
      .fail(function(jqXHR, textStatus, errorThrown) {
        var rateLimited =
            jqXHR.getResponseHeader("X-RateLimit-Remaining") === "0",
          rateLimitReset =
            rateLimited &&
            new Date(1000 * +jqXHR.getResponseHeader("X-RateLimit-Reset")),
          message = rateLimitReset
            ? "GitHub rate limit met. Reset at " +
              rateLimitReset.toLocaleTimeString() +
              "."
            : "Could not get issue count from GitHub: " +
              ((jqXHR.responseJSON && jqXHR.responseJSON.message) ||
                errorThrown) +
              ".";
        count.html("?!");
        count.attr("title", message);
      });
  };

  $(function() {
    var $window = $(window),
      onScreen = function onScreen($elem) {
        var docViewTop = $window.scrollTop(),
          docViewBottom = docViewTop + $window.height(),
          elemTop = $elem.offset().top,
          elemBottom = elemTop + $elem.height();
        return (
          (docViewTop <= elemTop && elemTop <= docViewBottom) ||
          (docViewTop <= elemBottom && elemBottom <= docViewBottom)
        );
      };

    $window.on("scroll chosen:updated", function() {
      $(".projects tbody:not(.counted)").each(function() {
        var project = $(this);
        if (onScreen(project)) {
          issueCount(project);
          project.addClass("counted");
        }
      });
    });

    compiledtemplateFn = _.template($("#projects-panel-template").html());
    projectsPanel = $("#projects-panel");

    projectsPanel.on("click", "a.remove-tag", function(e) {
      e.preventDefault();
      console.log("TEST");
      var tags = [];
      projectsPanel
        .find("a.remove-tag")
        .not(this)
        .each(function() {
          tags.push($(this).data("tag"));
        });
      var tagsString = tags.join(",");
      window.location.href = "#/tags/" + tagsString;
    });

    app.raise_errors = true;
    app.run("#/");
  });
});
