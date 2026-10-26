(function () {
  'use strict';

  var image = document.querySelector('.visitor-map__image');
  if (!image) return;
  var root = document.documentElement;
  var requested = false;
  var loading = false;
  var palette = '';

  function updateMap() {
    var nextPalette = root.getAttribute('data-theme') === 'dark' ? 'carbon' : 'slate';
    // Finish the first request before refreshing, so a fast theme toggle
    // cannot cancel the one request that records this page view.
    if (loading || nextPalette === palette) return;
    var url = new URL(image.getAttribute('data-src'));
    url.searchParams.set('pal', nextPalette);
    url.searchParams.set('url', window.location.href);
    // Stats4U's own refresh protocol: render the image without counting again.
    if (requested) url.searchParams.set('rl', '1');
    requested = true;
    loading = true;
    palette = nextPalette;
    image.src = url.href;
    image.hidden = false;
  }

  image.addEventListener('load', function () {
    loading = false;
    updateMap();
  });
  image.addEventListener('error', function () {
    loading = false;
    // Keep the alt text and statistics link available if the service is down.
    updateMap();
  });
  new MutationObserver(updateMap).observe(root, {
    attributes: true,
    attributeFilter: ['data-theme']
  });
  updateMap();
}());
