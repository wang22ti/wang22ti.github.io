(function () {
  "use strict";

  var areaOrder = [
    "Machine Learning",
    "Foundation Models",
    "Data Mining",
    "Other"
  ];

  function tagClassName(tag) {
    return tag
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function publicationYear(details, yearHeading) {
    var headingText = yearHeading ? yearHeading.textContent.trim() : "";
    if (/^\d{4}$/.test(headingText)) {
      return parseInt(headingText, 10);
    }

    var yearMatches = details.textContent.match(/\b(?:19|20)\d{2}\b/g);
    return yearMatches ? parseInt(yearMatches[yearMatches.length - 1], 10) : 0;
  }

  function initializePublicationSort() {
    var anchor = document.getElementById("-publications");
    var dataElement = document.getElementById("publication-topic-data");

    if (!anchor || !dataElement) {
      return;
    }

    var topicEntries;
    try {
      topicEntries = JSON.parse(dataElement.textContent);
    } catch (error) {
      return;
    }

    var metadataByUrl = {};
    topicEntries.forEach(function (entry) {
      metadataByUrl[entry.url] = entry;
    });

    var publicationElements = [];
    var sibling = anchor.nextElementSibling;
    while (sibling && sibling.tagName !== "H1") {
      publicationElements.push(sibling);
      sibling = sibling.nextElementSibling;
    }

    var yearHeadings = [];
    var publications = [];
    var currentYear = null;

    publicationElements.forEach(function (element) {
      if (element.tagName === "H2") {
        currentYear = element;
        yearHeadings.push(element);
        return;
      }

      if (element.tagName !== "P" || !element.querySelector("a[href]")) {
        return;
      }

      var details = element.nextElementSibling;
      if (!details || details.tagName !== "P") {
        return;
      }

      var titleLink = element.querySelector("a[href]");
      var metadata = metadataByUrl[titleLink.getAttribute("href")] || {};
      var area = metadata.area || "Other";
      var tags = Array.isArray(metadata.tags) ? metadata.tags : [];

      var article = document.createElement("article");
      article.className = "publication-item";
      article.setAttribute("data-area", area);
      article.appendChild(element);

      var tagList = null;
      if (tags.length) {
        tagList = document.createElement("span");
        tagList.className = "publication-tags";
        tagList.setAttribute("role", "list");
        tagList.setAttribute("aria-label", "Research tags");

        tags.forEach(function (tag) {
          var tagElement = document.createElement("span");
          tagElement.className = "publication-tag publication-tag--" + tagClassName(tag);
          tagElement.setAttribute("role", "listitem");
          tagElement.textContent = tag;
          tagList.appendChild(tagElement);
        });
      }

      article.appendChild(details);

      publications.push({
        article: article,
        titleElement: element,
        tagList: tagList,
        yearHeading: currentYear,
        year: currentYear ? currentYear.textContent.trim() : "",
        publicationYear: publicationYear(details, currentYear),
        area: area,
        tags: tags,
        isFirstAuthor: details.textContent.trim().indexOf("Zitai Wang") === 0,
        originalIndex: publications.length
      });
    });

    if (!publications.length) {
      return;
    }

    var controls = document.createElement("div");
    controls.className = "publication-sort";
    controls.setAttribute("role", "group");
    controls.setAttribute("aria-label", "Sort publications");
    controls.innerHTML =
      '<span class="publication-sort__label">Sort by:</span>' +
      '<div class="publication-sort__buttons" role="group" aria-label="Publication order">' +
      '<button type="button" class="publication-sort__button is-active" data-sort="year" aria-pressed="true">Year</button>' +
      '<button type="button" class="publication-sort__button" data-sort="topic" aria-pressed="false">Topic</button>' +
      "</div>";

    var filter = document.createElement("div");
    filter.className = "publication-filter";
    filter.innerHTML =
      '<span class="publication-filter__label">Filter:</span>' +
      '<button type="button" class="publication-filter__button" aria-haspopup="true" aria-expanded="false">' +
      '<span class="publication-filter__value">All</span>' +
      '<span class="publication-filter__chevron" aria-hidden="true">&#9662;</span>' +
      "</button>" +
      '<div class="publication-filter__menu" hidden>' +
      '<div class="publication-filter__menu-header">' +
      '<span class="publication-filter__menu-title"></span>' +
      '<button type="button" class="publication-filter__clear">Clear</button>' +
      "</div>" +
      '<div class="publication-filter__options"></div>' +
      "</div>";

    var headerControls = document.createElement("div");
    headerControls.className = "publication-controls";
    headerControls.appendChild(controls);
    headerControls.appendChild(filter);

    var list = document.createElement("div");
    list.className = "publication-list";

    var header = document.createElement("div");
    header.className = "publication-header";
    anchor.parentNode.insertBefore(header, anchor);
    header.appendChild(anchor);
    header.appendChild(headerControls);
    header.parentNode.insertBefore(list, header.nextSibling);

    var activeMode = "year";
    var selectedFilters = {
      year: [],
      topic: []
    };
    var filterButton = filter.querySelector(".publication-filter__button");
    var filterValue = filter.querySelector(".publication-filter__value");
    var filterMenu = filter.querySelector(".publication-filter__menu");
    var filterMenuTitle = filter.querySelector(".publication-filter__menu-title");
    var filterOptions = filter.querySelector(".publication-filter__options");
    var filterClear = filter.querySelector(".publication-filter__clear");

    var tagCounts = publications.reduce(function (counts, publication) {
      publication.tags.forEach(function (tag) {
        counts[tag] = (counts[tag] || 0) + 1;
      });
      return counts;
    }, {});

    var filterChoices = {
      year: yearHeadings.map(function (heading) {
        return heading.textContent.trim();
      }),
      topic: Object.keys(tagCounts).sort(function (first, second) {
        var countDifference = tagCounts[second] - tagCounts[first];
        return countDifference || first.localeCompare(second);
      })
    };

    function closeFilterMenu() {
      filterMenu.hidden = true;
      filterButton.setAttribute("aria-expanded", "false");
    }

    function updateFilterSummary() {
      var count = selectedFilters[activeMode].length;
      filterValue.textContent = count ? count + " selected" : "All";
      filterButton.setAttribute(
        "aria-label",
        "Filter publications by " + (activeMode === "year" ? "year" : "tag") +
          (count ? ". " + count + " selected." : ". All publications shown.")
      );
      filterClear.disabled = count === 0;
    }

    function updateFilterOptions() {
      var selected = selectedFilters[activeMode];
      filterMenuTitle.textContent = activeMode === "year" ? "Filter by year" : "Filter by tag";
      while (filterOptions.firstChild) {
        filterOptions.removeChild(filterOptions.firstChild);
      }

      filterChoices[activeMode].forEach(function (choice, index) {
        var label = document.createElement("label");
        label.className = "publication-filter__option";

        var checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = choice;
        checkbox.id = "publication-filter-" + activeMode + "-" + index;
        checkbox.checked = selected.indexOf(choice) !== -1;

        var text = document.createElement("span");
        if (activeMode === "topic") {
          text.className = "publication-filter__tag publication-tag--" + tagClassName(choice);
          text.textContent = choice + " (" + tagCounts[choice] + ")";
        } else {
          text.textContent = choice;
        }

        label.appendChild(checkbox);
        label.appendChild(text);
        filterOptions.appendChild(label);
      });

      updateFilterSummary();
    }

    function publicationMatchesFilter(publication) {
      var selected = selectedFilters[activeMode];
      if (!selected.length) {
        return true;
      }

      if (activeMode === "year") {
        return selected.indexOf(publication.year) !== -1;
      }

      return publication.tags.some(function (tag) {
        return selected.indexOf(tag) !== -1;
      });
    }

    function renderByYear() {
      yearHeadings.forEach(function (heading) {
        var yearPublications = publications.filter(function (publication) {
          return publication.yearHeading === heading && publicationMatchesFilter(publication);
        });

        if (yearPublications.length) {
          list.appendChild(heading);
          yearPublications.forEach(function (publication) {
            if (publication.tagList && publication.tagList.parentNode) {
              publication.tagList.parentNode.removeChild(publication.tagList);
            }
            list.appendChild(publication.article);
          });
        }
      });
    }

    function renderByTopic() {
      areaOrder.forEach(function (area) {
        var areaPublications = publications.filter(function (publication) {
          return publication.area === area && publicationMatchesFilter(publication);
        });

        if (!areaPublications.length) {
          return;
        }

        areaPublications.sort(function (first, second) {
          if (first.publicationYear !== second.publicationYear) {
            return second.publicationYear - first.publicationYear;
          }
          if (first.isFirstAuthor !== second.isFirstAuthor) {
            return first.isFirstAuthor ? -1 : 1;
          }
          return first.originalIndex - second.originalIndex;
        });

        var heading = document.createElement("h2");
        heading.className = "publication-area-heading";

        var headingLabel = document.createElement("span");
        headingLabel.textContent = area;
        heading.appendChild(headingLabel);

        list.appendChild(heading);

        areaPublications.forEach(function (publication) {
          if (publication.tagList && publication.tagList.parentNode !== publication.titleElement) {
            publication.titleElement.appendChild(publication.tagList);
          }
          list.appendChild(publication.article);
        });
      });
    }

    function setSortMode(mode) {
      activeMode = mode;
      while (list.firstChild) {
        list.removeChild(list.firstChild);
      }

      if (mode === "topic") {
        renderByTopic();
      } else {
        renderByYear();
      }

      controls.querySelectorAll("[data-sort]").forEach(function (button) {
        var isActive = button.getAttribute("data-sort") === mode;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
      });

      closeFilterMenu();
      updateFilterOptions();
    }

    controls.addEventListener("click", function (event) {
      var button = event.target.closest("[data-sort]");
      if (button) {
        setSortMode(button.getAttribute("data-sort"));
      }
    });

    filterButton.addEventListener("click", function () {
      var willOpen = filterMenu.hidden;
      filterMenu.hidden = !willOpen;
      filterButton.setAttribute("aria-expanded", String(willOpen));
    });

    filterOptions.addEventListener("change", function (event) {
      if (event.target.type !== "checkbox") {
        return;
      }

      var selected = selectedFilters[activeMode];
      var selectedIndex = selected.indexOf(event.target.value);
      if (event.target.checked && selectedIndex === -1) {
        selected.push(event.target.value);
      } else if (!event.target.checked && selectedIndex !== -1) {
        selected.splice(selectedIndex, 1);
      }

      updateFilterSummary();
      while (list.firstChild) {
        list.removeChild(list.firstChild);
      }
      if (activeMode === "topic") {
        renderByTopic();
      } else {
        renderByYear();
      }
    });

    filterClear.addEventListener("click", function () {
      selectedFilters[activeMode] = [];
      updateFilterOptions();
      while (list.firstChild) {
        list.removeChild(list.firstChild);
      }
      if (activeMode === "topic") {
        renderByTopic();
      } else {
        renderByYear();
      }
    });

    document.querySelectorAll("[data-publication-tags]").forEach(function (link) {
      link.addEventListener("click", function (event) {
        event.preventDefault();

        selectedFilters.topic = link
          .getAttribute("data-publication-tags")
          .split(",")
          .map(function (tag) {
            return tag.trim();
          })
          .filter(function (tag) {
            return filterChoices.topic.indexOf(tag) !== -1;
          });

        setSortMode("topic");
        if (window.history && window.history.replaceState) {
          window.history.replaceState(null, "", "#-publications");
        }
        anchor.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    document.addEventListener("click", function (event) {
      if (!filter.contains(event.target)) {
        closeFilterMenu();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !filterMenu.hidden) {
        closeFilterMenu();
        filterButton.focus();
      }
    });

    setSortMode("year");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializePublicationSort);
  } else {
    initializePublicationSort();
  }
})();
