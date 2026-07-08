/**
 * content-panels.js
 * -----------------------------------------------------------------------------
 * Overrides the 5 content render functions from main.js.
 * Reads directly from CS.get() — the raw page.json — no translation layer.
 *
 * Every field maps 1-to-1 with the page.json key path.
 * oninput/onchange handlers call CS.update('dotted.path', value).
 *
 * Load order in index.html:
 *   <script src="main.js"></script>
 *   <script src="content-store.js"></script>
 *   <script src="content-panels.js"></script>
 * -----------------------------------------------------------------------------
 */

(function (window) {
  'use strict';

  // ---------------------------------------------------------------------------
  // Shared helpers
  // ---------------------------------------------------------------------------

  function esc(s) {
    if (s === null || s === undefined) return '';
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function field(label, inputHtml, hint) {
    return '<div class="field"><label>' + label + '</label>' +
      inputHtml + (hint ? '<div class="field-hint">' + hint + '</div>' : '') +
      '</div>';
  }

  function textarea(path, value, rows) {
    return '<textarea rows="' + (rows || 4) + '" ' +
      'oninput="CS.update(\'' + path + '\', this.value)">' +
      esc(value) + '</textarea>';
  }

  function textinput(path, value, placeholder) {
    return '<input value="' + esc(value) + '" ' +
      (placeholder ? 'placeholder="' + esc(placeholder) + '" ' : '') +
      'oninput="CS.update(\'' + path + '\', this.value)">';
  }

  function draftBar(section) {
    if (!window.drafts || !window.drafts[section]) return '';
    return '<div class="draft-bar">' +
      '<div class="db-left"><span class="db-icon">\uD83D\uDFE1</span>' +
      'Unsaved draft \u2014 not yet published.</div>' +
      '<div style="display:flex;gap:8px;">' +
      '<button class="btn btn-ghost btn-sm" onclick="CS.discard(\'' + section + '\')">Discard draft</button>' +
      '<button class="btn btn-publish btn-sm" onclick="CS.publish(\'' + section + '\')">\u2191 Publish</button>' +
      '</div></div>';
  }

  function publishBar(section) {
    return window.drafts && window.drafts[section]
      ? '<button class="btn btn-ghost btn-sm" onclick="CS.discard(\'' + section + '\')">Discard draft</button>' +
        '<button class="btn btn-publish" onclick="CS.publish(\'' + section + '\')">\u2191 Publish</button>'
      : '';
  }

  function sectionCard(title, sub, body) {
    return '<div class="section-card"><h4>' + title + '</h4>' +
      (sub ? '<div class="sc-sub">' + sub + '</div>' : '') +
      body + '</div>';
  }

  function listItem(dragHandle, titleHtml, subHtml, actionsHtml) {
    return '<div class="list-item">' +
      (dragHandle ? '<span class="li-drag">\u2807</span>' : '') +
      '<div class="li-body">' +
        '<div class="li-title">' + titleHtml + '</div>' +
        (subHtml ? '<div class="li-sub">' + subHtml + '</div>' : '') +
      '</div>' +
      '<div class="li-actions">' + actionsHtml + '</div>' +
      '</div>';
  }

  function header(title, desc, actions) {
    return '<div class="main-header">' +
      '<div class="main-header-left"><h2>' + title + '</h2><p>' + desc + '</p></div>' +
      '<div class="main-header-actions">' + (actions || '') + '</div>' +
      '</div>';
  }

  // ---------------------------------------------------------------------------
  // LANDING PAGE
  // page.json keys used:
  //   landing.marquee[].value, .label, .highlight
  //   landing.hero.eyebrow, .headingLine1
  //   landing.featuredInitiative.refId
  //   landing.videoSlides.refIds[]
  //   landing.storyhub.refIds[]
  // ---------------------------------------------------------------------------

  window.renderLanding = function () {
    var d = CS.get();
    if (!d) { _noData('mainArea'); return; }
    var l = d.landing || {};

    // Marquee items
    var marqueeRows = (l.marquee || []).map(function (m, i) {
      return listItem(true,
        '<span style="font-weight:bold">' + esc(m.value) + '</span> ' +
        '<span style="color:var(--txt2)">\u00b7 ' + esc(m.label) + '</span>' +
        (m.highlight ? ' <span class="pill pill-deployed" style="font-size:10px;margin-left:6px;">Highlight</span>' : ''),
        null,
        '<button class="btn btn-ghost btn-sm btn-icon" onclick="_openMarqueeDrawer(' + i + ')">Edit</button>' +
        '<button class="btn btn-ghost btn-sm btn-icon" onclick="CS.removeItem(\'landing.marquee\',' + i + ');window.renderLanding()">&#x2715;</button>'
      );
    }).join('');

    // Video refIds
    var videoRows = (l.videoSlides && l.videoSlides.refIds || []).map(function (id, i) {
      return listItem(true,
        esc(id),
        null,
        '<button class="btn btn-ghost btn-sm btn-icon" onclick="CS.removeItem(\'landing.videoSlides.refIds\',' + i + ');window.renderLanding()">&#x2715;</button>'
      );
    }).join('');

    // Featured initiative options — from topInitiatives items
    var initItems = (d.innovation && d.innovation.topInitiatives && d.innovation.topInitiatives.items) || [];
    var featuredRef = (l.featuredInitiative && l.featuredInitiative.refId) || '';
    var initOpts = initItems.map(function (it) {
      return '<option value="' + esc(it.id) + '"' + (it.id === featuredRef ? ' selected' : '') + '>' +
        esc(it.title) + '</option>';
    }).join('');

    document.getElementById('mainArea').innerHTML =
      header('Landing page', 'Edit the marquee stats, hero text, featured initiative, and video shelf.', publishBar('landing')) +
      draftBar('landing') +
      '<div class="panel-body">' +

      sectionCard('Marquee stats',
        'The four rolling numbers shown at the top of the page.',
        marqueeRows +
        '<button class="add-btn" onclick="_openMarqueeDrawer(-1)">+ Add stat</button>'
      ) +

      sectionCard('Hero text',
        'Eyebrow label and first heading line.',
        '<div class="form-grid" style="grid-template-columns:1fr 1fr;gap:14px;">' +
          field('Eyebrow', textinput('landing.hero.eyebrow', (l.hero && l.hero.eyebrow) || '')) +
          field('Heading line 1', textinput('landing.hero.headingLine1', (l.hero && l.hero.headingLine1) || '')) +
        '</div>'
      ) +

      sectionCard('Featured initiative',
        'The large spotlight card on the landing page.',
        field('Initiative', '<select onchange="CS.update(\'landing.featuredInitiative.refId\',this.value)">' + initOpts + '</select>',
          'Editorially chosen \u2014 not date-driven.')
      ) +

      sectionCard('Video shelf',
        'refIds that appear in the scrollable video row. Order matters.',
        videoRows +
        '<button class="add-btn" onclick="_promptAddVideoRef()">+ Add video ref</button>'
      ) +

      '</div>';
  };

  // Marquee drawer
  window._openMarqueeDrawer = function (idx) {
    var d   = CS.get();
    var arr = (d && d.landing && d.landing.marquee) || [];
    var m   = idx >= 0 ? arr[idx] : { value: '', label: '', highlight: false };
    var isNew = idx < 0;

    document.getElementById('drawerTitle').textContent = isNew ? 'Add marquee stat' : 'Edit marquee stat';
    document.getElementById('drawerSub').textContent   = 'landing.marquee' + (isNew ? '' : '[' + idx + ']');
    document.getElementById('drawerDelete').style.display = isNew ? 'none' : '';
    document.getElementById('drawerDelete').onclick = function () {
      CS.removeItem('landing.marquee', idx);
      closeDrawer(); window.renderLanding();
    };
    document.getElementById('drawerBody').innerHTML =
      '<div class="form-grid" style="grid-template-columns:1fr 1fr;gap:14px;">' +
        field('Value', '<input id="mq_val" value="' + esc(m.value) + '">') +
        field('Label', '<input id="mq_lbl" value="' + esc(m.label) + '">') +
        field('Highlight', '<select id="mq_hl"><option value="false"' + (!m.highlight ? ' selected' : '') + '>No</option>' +
          '<option value="true"' + (m.highlight ? ' selected' : '') + '>Yes</option></select>') +
      '</div>';
    document.getElementById('drawerOverlay').className = 'drawer-overlay open';
    window._saveDrawerCurrentFn = function () {
      var newItem = {
        value:     document.getElementById('mq_val').value,
        label:     document.getElementById('mq_lbl').value,
        highlight: document.getElementById('mq_hl').value === 'true',
      };
      if (isNew) {
        CS.addItem('landing.marquee', newItem);
      } else {
        CS.update('landing.marquee.' + idx + '.value',     newItem.value);
        CS.update('landing.marquee.' + idx + '.label',     newItem.label);
        CS.update('landing.marquee.' + idx + '.highlight', newItem.highlight);
      }
      window.markDraft && window.markDraft('landing');
      closeDrawer(); window.renderLanding();
    };
  };

  window._promptAddVideoRef = function () {
    var id = prompt('Video refId (e.g. video-003):');
    if (!id) return;
    CS.addItem('landing.videoSlides.refIds', id.trim());
    window.markDraft && window.markDraft('landing');
    window.renderLanding();
  };

  // ---------------------------------------------------------------------------
  // REA STORY
  // page.json keys used:
  //   reaStory.teaser.headline, .sectionLabel
  //   reaStory.rea.tag, .heading, .body, .video
  //   reaStory.bpm.tag, .heading, .body, .image
  // ---------------------------------------------------------------------------

  window.renderREAStory = function () {
    var d = CS.get();
    if (!d) { _noData('mainArea'); return; }
    var rs = d.reaStory || {};

    document.getElementById('mainArea').innerHTML =
      header('REA Story', 'The two scroll panels: what REA is, and who drives it.', publishBar('reastory')) +
      draftBar('reastory') +
      '<div class="panel-body">' +

      sectionCard('Teaser card',
        'The storyhub teaser that links to this section.',
        '<div class="form-grid" style="grid-template-columns:1fr 1fr;gap:14px;">' +
          field('Section label', textinput('reaStory.teaser.sectionLabel', rs.teaser && rs.teaser.sectionLabel)) +
          field('Teaser headline', textinput('reaStory.teaser.headline',    rs.teaser && rs.teaser.headline)) +
        '</div>'
      ) +

      sectionCard('Panel 1 \u2014 What REA is',
        'reaStory.rea',
        '<div class="form-grid" style="grid-template-columns:1fr;gap:14px;">' +
          field('Tag', textinput('reaStory.rea.tag', rs.rea && rs.rea.tag)) +
          field('Heading', textinput('reaStory.rea.heading', rs.rea && rs.rea.heading)) +
          field('Body copy', textarea('reaStory.rea.body', rs.rea && rs.rea.body, 6)) +
          field('Video path', textinput('reaStory.rea.video', rs.rea && rs.rea.video), 'e.g. media/videos/rea-video.mp4') +
        '</div>'
      ) +

      sectionCard('Panel 2 \u2014 Who drives it (BPM)',
        'reaStory.bpm',
        '<div class="form-grid" style="grid-template-columns:1fr;gap:14px;">' +
          field('Tag', textinput('reaStory.bpm.tag', rs.bpm && rs.bpm.tag)) +
          field('Heading', textinput('reaStory.bpm.heading', rs.bpm && rs.bpm.heading)) +
          field('Body copy', textarea('reaStory.bpm.body', rs.bpm && rs.bpm.body, 5)) +
          field('Image path', textinput('reaStory.bpm.image', rs.bpm && rs.bpm.image), 'e.g. media/Images/bpm.png') +
        '</div>'
      ) +

      '</div>';
  };

  // ---------------------------------------------------------------------------
  // INNOVATION PORTFOLIO
  // page.json keys used:
  //   innovation.teaser.headline, .sectionLabel
  //   innovation.sectionSub
  //   innovation.topInitiatives.rowLabel, .rowTitle, .rowNote, .items[]
  //     item: id, rank, title, image, body, ctaLabel, ctaHref, stream, businessArea, stats[]
  //   innovation.deployed.items[]
  //   innovation.comingSoon.items[]
  //   innovation.videos.items[]
  // ---------------------------------------------------------------------------

  window.renderPortfolio = function () {
    var d = CS.get();
    if (!d) { _noData('mainArea'); return; }
    var iv = d.innovation || {};

    // Top initiatives ranked list
    var topItems = (iv.topInitiatives && iv.topInitiatives.items) || [];
    var rankedRows = topItems.map(function (item, i) {
      return listItem(false,
        '<span style="font-size:20px;font-weight:bold;color:var(--txt2);opacity:.3;margin-right:8px;">' + (i + 1) + '</span>' +
        esc(item.title),
        esc(item.id) + ' \u00b7 ' + esc(item.stream || '') + (item.businessArea ? ' \u00b7 ' + esc(item.businessArea) : ''),
        '<button class="btn btn-ghost btn-sm btn-icon" onclick="CS.moveItem(\'innovation.topInitiatives.items\',' + i + ',-1);window.renderPortfolio()">\u2191</button>' +
        '<button class="btn btn-ghost btn-sm btn-icon" onclick="CS.moveItem(\'innovation.topInitiatives.items\',' + i + ',1);window.renderPortfolio()">\u2193</button>' +
        '<button class="btn btn-ghost btn-sm" onclick="_openInitiativeDrawer(' + i + ')">Edit</button>'
      );
    }).join('');

    //Deployed list
    var deployed = (iv.deployed && iv.deployed.items) || [];
    var deployedRows = deployed.map(function (item, i) {
      return listItem(true, 
        esc(item.title),
        esc((item.description).substring(0, 70)) + '\u2026',
        '<button class="btn btn-ghost btn-sm btn-icon" onclick="_openDeployedDrawer(' + i + ')">Edit</button>' +
        '<button class="btn btn-ghost btn-sm btn-icon" onclick="CS.removeItem(\'innovation.deployed.items\',' + i + ');window.renderPortfolio()">&#x2715;</button>'
      );
    }).join('');

    // Coming soon list
    var comingSoon = (iv.comingSoon && iv.comingSoon.items) || [];
    var comingRows = comingSoon.map(function (item, i) {
      return listItem(true,
        esc(item.title),
        esc((item.body || item.description || '').substring(0, 70)) + '\u2026',
        '<button class="btn btn-ghost btn-sm btn-icon" onclick="_openComingSoonDrawer(' + i + ')">Edit</button>' +
        '<button class="btn btn-ghost btn-sm btn-icon" onclick="CS.removeItem(\'innovation.comingSoon.items\',' + i + ');window.renderPortfolio()">&#x2715;</button>'
      );
    }).join('');

    // Videos list
    var videos = (iv.videos && iv.videos.items) || [];
    var videoRows = videos.map(function (v, i) {
      return listItem(true,
        esc(v.title),
        esc(v.tag) + ' \u00b7 ' + esc(v.id),
        '<button class="btn btn-ghost btn-sm" onclick="_openVideoDrawer(' + i + ')">Edit</button>' +
        '<button class="btn btn-ghost btn-sm btn-icon" onclick="CS.removeItem(\'innovation.videos.items\',' + i + ');window.renderPortfolio()">&#x2715;</button>'
      );
    }).join('');

    document.getElementById('mainArea').innerHTML =
      header('Innovation Portfolio', 'Top initiatives, coming soon, and video highlights.', publishBar('portfolio')) +
      draftBar('portfolio') +
      '<div class="panel-body">' +

      sectionCard('Section copy',
        'innovation.sectionSub',
        '<div class="form-grid" style="grid-template-columns:1fr 1fr;gap:14px;">' +
          field('Teaser headline', textinput('innovation.teaser.headline', iv.teaser && iv.teaser.headline)) +
          field('Section subtitle', textinput('innovation.sectionSub', iv.sectionSub)) +
        '</div>'
      ) +

      sectionCard('Top initiatives',
        'Drag or use arrows to reorder. Click Edit to update story, stats, and media.',
        rankedRows
      ) +

      sectionCard('Deployed',
        'Deployed Initiatives',
        deployedRows
      ) +

      sectionCard('Coming soon',
        'Coming Soon Initiatives',
        comingRows +
        '<button class="add-btn" onclick="_openComingSoonDrawer(-1)">+ Add item</button>'
      ) +

      sectionCard('Video highlights',
        'innovation.videos.items',
        videoRows +
        '<button class="add-btn" onclick="_openVideoDrawer(-1)">+ Add video</button>'
      ) +

      '</div>';
  };

  // Initiative drawer
  window._openInitiativeDrawer = function (idx) {
    var d    = CS.get();
    var item = ((d.innovation.topInitiatives || {}).items || [])[idx];
    if (!item) return;
    var base = 'innovation.topInitiatives.items.' + idx;

    document.getElementById('drawerTitle').textContent = 'Edit initiative \u2014 ' + item.title;
    document.getElementById('drawerSub').textContent   = item.id;
    document.getElementById('drawerDelete').style.display = 'none';
    document.getElementById('drawerBody').innerHTML =
      '<div class="form-grid" style="grid-template-columns:1fr 1fr;gap:14px;">' +
        field('Title', textinput(base + '.title', item.title)) +
        field('Stream', textinput(base + '.stream', item.stream)) +
        field('Business area', textinput(base + '.businessArea', item.businessArea)) +
        field('Image path', textinput(base + '.image', item.image)) +
        '<div class="field" style="grid-column:span 2">' +
          '<label>Body / teaser</label>' + textarea(base + '.body', item.body, 3) +
        '</div>' +
        '<div class="field" style="grid-column:span 2">' +
          '<label>Description (full text)</label>' + textarea(base + '.description', item.description, 5) +
        '</div>' +
        field('CTA label', textinput(base + '.ctaLabel', item.ctaLabel)) +
        field('CTA href', textinput(base + '.ctaHref', item.ctaHref)) +
        '<div class="field" style="grid-column:span 2"><label>Stats</label>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' +
          (item.stats || []).map(function (s, si) {
            return '<div style="display:flex;gap:6px;">' +
              '<input placeholder="Value" value="' + esc(s.value) + '" oninput="CS.update(\'' + base + '.stats.' + si + '.value\',this.value)">' +
              '<input placeholder="Label" value="' + esc(s.label) + '" oninput="CS.update(\'' + base + '.stats.' + si + '.label\',this.value)">' +
            '</div>';
          }).join('') +
          '</div></div>' +
        '<div class="field" style="grid-column:span 2"><label>Story \u2014 heading</label>' +
          textinput(base + '.story.heading', item.story && item.story.heading) +
        '</div>' +
        '<div class="field" style="grid-column:span 2"><label>Story \u2014 body</label>' +
          textarea(base + '.story.body', item.story && item.story.body, 6) +
        '</div>' +
        field('Story \u2014 eyebrow', textinput(base + '.story.eyebrow', item.story && item.story.eyebrow)) +
        field('Story \u2014 closing line', textinput(base + '.story.closing.line', item.story && item.story.closing && item.story.closing.line)) +
        '<div class="field" style="grid-column:span 2"><label>Story \u2014 closing body</label>' +
          textarea(base + '.story.closing.body', item.story && item.story.closing && item.story.closing.body, 3) +
        '</div>' +
      '</div>';
    document.getElementById('drawerOverlay').className = 'drawer-overlay open';
    window._saveDrawerCurrentFn = function () {
      window.markDraft && window.markDraft('portfolio');
      closeDrawer(); window.renderPortfolio();
    };
  };


  //Deployed Drawer
    window._openDeployedDrawer = function (idx) {
    var d   = CS.get();
    var arr = (d.innovation.deployed && d.innovation.deployed.items) || [];
    var item = idx >= 0 ? arr[idx] : { title: '', description: '', image: '' };
    var isNew = idx < 0;
    var base = 'innovation.deployed.items.' + idx;

    document.getElementById('drawerTitle').textContent = isNew ? 'Add deployed' : 'Edit deployed';
    document.getElementById('drawerSub').textContent   = isNew ? '' : item.title;
    document.getElementById('drawerDelete').style.display = isNew ? 'none' : '';
    document.getElementById('drawerDelete').onclick = function () {
      CS.removeItem('innovation.deployed.items', idx);
      closeDrawer(); window.renderPortfolio();
    };
    document.getElementById('drawerBody').innerHTML =
      '<div class="form-grid" style="grid-template-columns:1fr;gap:14px;">' +
        field('Title', '<input id="cs_title" value="' + esc(item.title) + '">') +
        field('Body', '<textarea id="cs_body" rows="3">' + esc(item.description) + '</textarea>') +
        field('Image path', '<input id="cs_img" value="' + esc(item.image) + '">') +
      '</div>';
    document.getElementById('drawerOverlay').className = 'drawer-overlay open';
    window._saveDrawerCurrentFn = function () {
      var newItem = {
        title: document.getElementById('cs_title').value,
        body:  document.getElementById('cs_body').value,
        image: document.getElementById('cs_img').value,
        description: '',
      };
      if (isNew) {
        CS.addItem('innovation.deployed.items', newItem);
      } else {
        CS.update(base + '.title', newItem.title);
        CS.update(base + '.body',  newItem.body);
        CS.update(base + '.image', newItem.image);
      }
      window.markDraft && window.markDraft('portfolio');
      closeDrawer(); window.renderPortfolio();
    };
  };

  // Coming soon drawer
  window._openComingSoonDrawer = function (idx) {
    var d   = CS.get();
    var arr = (d.innovation.comingSoon && d.innovation.comingSoon.items) || [];
    var item = idx >= 0 ? arr[idx] : { title: '', body: '', image: '' };
    var isNew = idx < 0;
    var base = 'innovation.comingSoon.items.' + idx;

    document.getElementById('drawerTitle').textContent = isNew ? 'Add coming soon' : 'Edit coming soon';
    document.getElementById('drawerSub').textContent   = isNew ? '' : item.title;
    document.getElementById('drawerDelete').style.display = isNew ? 'none' : '';
    document.getElementById('drawerDelete').onclick = function () {
      CS.removeItem('innovation.comingSoon.items', idx);
      closeDrawer(); window.renderPortfolio();
    };
    document.getElementById('drawerBody').innerHTML =
      '<div class="form-grid" style="grid-template-columns:1fr;gap:14px;">' +
        field('Title', '<input id="cs_title" value="' + esc(item.title) + '">') +
        field('Body', '<textarea id="cs_body" rows="3">' + esc(item.body) + '</textarea>') +
        field('Image path', '<input id="cs_img" value="' + esc(item.image) + '">') +
      '</div>';
    document.getElementById('drawerOverlay').className = 'drawer-overlay open';
    window._saveDrawerCurrentFn = function () {
      var newItem = {
        title: document.getElementById('cs_title').value,
        body:  document.getElementById('cs_body').value,
        image: document.getElementById('cs_img').value,
        description: '',
      };
      if (isNew) {
        CS.addItem('innovation.comingSoon.items', newItem);
      } else {
        CS.update(base + '.title', newItem.title);
        CS.update(base + '.body',  newItem.body);
        CS.update(base + '.image', newItem.image);
      }
      window.markDraft && window.markDraft('portfolio');
      closeDrawer(); window.renderPortfolio();
    };
  };

  // Video drawer
  window._openVideoDrawer = function (idx) {
    var d   = CS.get();
    var arr = (d.innovation.videos && d.innovation.videos.items) || [];
    var v = idx >= 0 ? arr[idx] : { id: '', tag: '', title: '', thumbnail: '', poster: '', src: '' };
    var isNew = idx < 0;
    var base  = 'innovation.videos.items.' + idx;

    document.getElementById('drawerTitle').textContent = isNew ? 'Add video' : 'Edit video';
    document.getElementById('drawerSub').textContent   = isNew ? '' : v.id;
    document.getElementById('drawerDelete').style.display = isNew ? 'none' : '';
    document.getElementById('drawerDelete').onclick = function () {
      CS.removeItem('innovation.videos.items', idx);
      closeDrawer(); window.renderPortfolio();
    };
    document.getElementById('drawerBody').innerHTML =
      '<div class="form-grid" style="grid-template-columns:1fr 1fr;gap:14px;">' +
        field('ID', '<input id="v_id" value="' + esc(v.id) + '">') +
        field('Tag / length', '<input id="v_tag" value="' + esc(v.tag) + '">') +
        '<div class="field" style="grid-column:span 2">' +
          field('Title', '<input id="v_title" value="' + esc(v.title) + '">') +
        '</div>' +
        field('Thumbnail path', '<input id="v_thumb" value="' + esc(v.thumbnail) + '">') +
        field('Poster path', '<input id="v_poster" value="' + esc(v.poster) + '">') +
        '<div class="field" style="grid-column:span 2">' +
          field('Video src', '<input id="v_src" value="' + esc(v.src) + '">') +
        '</div>' +
      '</div>';
    document.getElementById('drawerOverlay').className = 'drawer-overlay open';
    window._saveDrawerCurrentFn = function () {
      var nv = {
        id: document.getElementById('v_id').value,
        tag: document.getElementById('v_tag').value,
        title: document.getElementById('v_title').value,
        thumbnail: document.getElementById('v_thumb').value,
        poster: document.getElementById('v_poster').value,
        src: document.getElementById('v_src').value,
        featured: true,
      };
      if (isNew) {
        CS.addItem('innovation.videos.items', nv);
      } else {
        ['id','tag','title','thumbnail','poster','src'].forEach(function (k) {
          CS.update(base + '.' + k, nv[k]);
        });
      }
      window.markDraft && window.markDraft('portfolio');
      closeDrawer(); window.renderPortfolio();
    };
  };

  // ---------------------------------------------------------------------------
  // SPOTLIGHT
  // page.json keys used:
  //   spotlight.teaser.headline, .sectionLabel
  //   spotlight.testimonials.actTitle, .actDesc, .items[].quote, .name, .role
  //   spotlight.people.actTitle, .actDesc, .items[].name, .contribution, .tag
  // ---------------------------------------------------------------------------

  window.renderSpotlight = function () {
    var d = CS.get();
    if (!d) { _noData('mainArea'); return; }
    var sp = d.spotlight || {};

    var testItems = (sp.testimonials && sp.testimonials.items) || [];
    var testimonialRows = testItems.map(function (t, i) {
      return listItem(true,
        '\u201c' + esc(t.quote.substring(0, 65)) + '\u2026\u201d',
        esc(t.name) + ' \u00b7 ' + esc(t.role),
        '<button class="btn btn-ghost btn-sm btn-icon" onclick="_openTestimonialDrawer(' + i + ')">&#x270E;</button>' +
        '<button class="btn btn-ghost btn-sm btn-icon" onclick="CS.removeItem(\'spotlight.testimonials.items\',' + i + ');window.renderSpotlight()">&#x2715;</button>'
      );
    }).join('');

    var peopleItems = (sp.people && sp.people.items) || [];
    var peopleRows = peopleItems.map(function (p, i) {
      return listItem(true,
        esc(p.name),
        esc(p.contribution) + ' \u00b7 <span class="pill pill-deployed" style="font-size:10px;">' + esc(p.tag) + '</span>',
        '<button class="btn btn-ghost btn-sm btn-icon" onclick="_openPersonDrawer(' + i + ')">&#x270E;</button>' +
        '<button class="btn btn-ghost btn-sm btn-icon" onclick="CS.removeItem(\'spotlight.people.items\',' + i + ');window.renderSpotlight()">&#x2715;</button>'
      );
    }).join('');

    document.getElementById('mainArea').innerHTML =
      header('Spotlight', 'Curate testimonials and the people driving REA.', publishBar('spotlight')) +
      draftBar('spotlight') +
      '<div class="panel-body">' +

      sectionCard('Teaser card',
        null,
        '<div class="form-grid" style="grid-template-columns:1fr 1fr;gap:14px;">' +
          field('Section label', textinput('spotlight.teaser.sectionLabel', sp.teaser && sp.teaser.sectionLabel)) +
          field('Teaser headline', textinput('spotlight.teaser.headline',    sp.teaser && sp.teaser.headline)) +
        '</div>'
      ) +

      sectionCard(
        (sp.testimonials && sp.testimonials.actTitle) || 'Testimonials',
        (sp.testimonials && sp.testimonials.actDesc) || '',
        testimonialRows +
        '<button class="add-btn" onclick="_openTestimonialDrawer(-1)">+ Add testimonial</button>'
      ) +

      sectionCard(
        (sp.people && sp.people.actTitle) || 'People',
        (sp.people && sp.people.actDesc) || '',
        peopleRows +
        '<button class="add-btn" onclick="_openPersonDrawer(-1)">+ Add person</button>'
      ) +

      '</div>';
  };

  window._openTestimonialDrawer = function (idx) {
    var d   = CS.get();
    var arr = (d.spotlight.testimonials && d.spotlight.testimonials.items) || [];
    var t   = idx >= 0 ? arr[idx] : { quote: '', name: 'Process Owner', role: '' };
    var isNew = idx < 0;
    var base  = 'spotlight.testimonials.items.' + idx;

    document.getElementById('drawerTitle').textContent = isNew ? 'Add testimonial' : 'Edit testimonial';
    document.getElementById('drawerSub').textContent   = isNew ? '' : t.name + ' \u00b7 ' + t.role;
    document.getElementById('drawerDelete').style.display = isNew ? 'none' : '';
    document.getElementById('drawerDelete').onclick = function () {
      CS.removeItem('spotlight.testimonials.items', idx);
      closeDrawer(); window.renderSpotlight();
    };
    document.getElementById('drawerBody').innerHTML =
      '<div class="form-grid" style="grid-template-columns:1fr;gap:14px;">' +
        field('Quote', '<textarea id="t_quote" rows="3">' + esc(t.quote) + '</textarea>') +
        field('Name', '<input id="t_name" value="' + esc(t.name) + '">') +
        field('Role / Department', '<input id="t_role" value="' + esc(t.role) + '">') +
      '</div>';
    document.getElementById('drawerOverlay').className = 'drawer-overlay open';
    window._saveDrawerCurrentFn = function () {
      var ni = {
        quote: document.getElementById('t_quote').value,
        name:  document.getElementById('t_name').value,
        role:  document.getElementById('t_role').value,
      };
      if (isNew) {
        CS.addItem('spotlight.testimonials.items', ni);
      } else {
        CS.update(base + '.quote', ni.quote);
        CS.update(base + '.name',  ni.name);
        CS.update(base + '.role',  ni.role);
      }
      window.markDraft && window.markDraft('spotlight');
      closeDrawer(); window.renderSpotlight();
    };
  };

  window._openPersonDrawer = function (idx) {
    var d   = CS.get();
    var arr = (d.spotlight.people && d.spotlight.people.items) || [];
    var p   = idx >= 0 ? arr[idx] : { name: '', contribution: '', tag: 'Submitter' };
    var isNew = idx < 0;
    var base  = 'spotlight.people.items.' + idx;
    var tagOpts = ['Submitter','Builder','Champion','Pilot'].map(function (tg) {
      return '<option' + (tg === p.tag ? ' selected' : '') + '>' + tg + '</option>';
    }).join('');

    document.getElementById('drawerTitle').textContent = isNew ? 'Add person' : 'Edit person';
    document.getElementById('drawerSub').textContent   = isNew ? '' : p.name;
    document.getElementById('drawerDelete').style.display = isNew ? 'none' : '';
    document.getElementById('drawerDelete').onclick = function () {
      CS.removeItem('spotlight.people.items', idx);
      closeDrawer(); window.renderSpotlight();
    };
    document.getElementById('drawerBody').innerHTML =
      '<div class="form-grid" style="grid-template-columns:1fr;gap:14px;">' +
        field('Name', '<input id="p_name" value="' + esc(p.name) + '">') +
        field('Contribution', '<textarea id="p_contrib" rows="2">' + esc(p.contribution) + '</textarea>') +
        field('Tag', '<select id="p_tag">' + tagOpts + '</select>') +
      '</div>';
    document.getElementById('drawerOverlay').className = 'drawer-overlay open';
    window._saveDrawerCurrentFn = function () {
      var ni = {
        name:         document.getElementById('p_name').value,
        contribution: document.getElementById('p_contrib').value,
        tag:          document.getElementById('p_tag').value,
      };
      if (isNew) {
        CS.addItem('spotlight.people.items', ni);
      } else {
        CS.update(base + '.name',         ni.name);
        CS.update(base + '.contribution', ni.contribution);
        CS.update(base + '.tag',          ni.tag);
      }
      window.markDraft && window.markDraft('spotlight');
      closeDrawer(); window.renderSpotlight();
    };
  };

  // ---------------------------------------------------------------------------
  // WHAT'S NEW
  // page.json keys used:
  //   whatsNew.teaser.headline, .sectionLabel
  //   whatsNew.sectionSub
  //   whatsNew.editorsPick.heading, .body
  //   whatsNew.buzzItems[].id, .age, .isNew, .headline, .body, .benefits[]
  // ---------------------------------------------------------------------------

  window.renderWhatsNew = function () {
    var d = CS.get();
    if (!d) { _noData('mainArea'); return; }
    var wn = d.whatsNew || {};

    var buzzItems = wn.buzzItems || [];
    var buzzRows = buzzItems.map(function (b, i) {
      var base = 'whatsNew.buzzItems.' + i;
      return '<div class="section-card" style="margin-bottom:12px;">' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">' +
          '<span class="pill ' + (b.isNew ? 'pill-deployed' : 'pill-uat') + '" style="font-size:10px;">' +
            esc(b.age) + '</span>' +
          '<span style="font-size:11px;color:var(--txt2);">' + esc(b.id) + '</span>' +
          '<div style="margin-left:auto;display:flex;gap:6px;">' +
            '<label style="font-size:12px;display:flex;align-items:center;gap:4px;">' +
              '<input type="checkbox"' + (b.isNew ? ' checked' : '') +
              ' onchange="CS.update(\'' + base + '.isNew\',this.checked)"> New</label>' +
            '<button class="btn btn-danger btn-sm" onclick="CS.removeItem(\'whatsNew.buzzItems\',' + i + ');window.renderWhatsNew()">Remove</button>' +
          '</div>' +
        '</div>' +
        '<div class="form-grid" style="grid-template-columns:1fr 1fr;gap:10px;">' +
          field('Headline', textinput(base + '.headline', b.headline)) +
          field('Age label', textinput(base + '.age', b.age)) +
          '<div class="field" style="grid-column:span 2">' +
            '<label>Body</label>' + textarea(base + '.body', b.body, 3) +
          '</div>' +
          '<div class="field" style="grid-column:span 2"><label>Benefits (one per line)</label>' +
            '<textarea rows="3" oninput="CS.update(\'' + base + '.benefits\',this.value.split(\'\\n\').filter(Boolean))">' +
            esc((b.benefits || []).join('\n')) + '</textarea>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');

    document.getElementById('mainArea').innerHTML =
      header("What's New", "Editor's pick and buzz feed cards.", publishBar('whatsnew')) +
      draftBar('whatsnew') +
      '<div class="panel-body">' +

      sectionCard('Teaser card',
        null,
        '<div class="form-grid" style="grid-template-columns:1fr 1fr;gap:14px;">' +
          field('Section label', textinput('whatsNew.teaser.sectionLabel', wn.teaser && wn.teaser.sectionLabel)) +
          field('Teaser headline', textinput('whatsNew.teaser.headline',    wn.teaser && wn.teaser.headline)) +
          field('Section subtitle', textinput('whatsNew.sectionSub', wn.sectionSub)) +
        '</div>'
      ) +

      sectionCard("Editor's pick",
        'The large spotlight card. whatsNew.editorsPick',
        '<div class="form-grid" style="grid-template-columns:1fr;gap:14px;">' +
          field('Heading', textinput('whatsNew.editorsPick.heading', wn.editorsPick && wn.editorsPick.heading)) +
          field('Body', textarea('whatsNew.editorsPick.body', wn.editorsPick && wn.editorsPick.body, 3)) +
        '</div>'
      ) +

      '<div class="section-card"><h4>Buzz items <span style="font-size:11px;color:var(--txt2);font-weight:normal;">' +
        buzzItems.length + ' of 5 slots</span></h4>' +
        '<div class="sc-sub">whatsNew.buzzItems \u2014 full objects with id, age, headline, body, benefits[]</div>' +
        buzzRows +
        (buzzItems.length < 5
          ? '<button class="add-btn" onclick="_addBuzzItem()">+ Add buzz item</button>'
          : '<div class="field-hint">5-slot limit reached.</div>') +
      '</div>' +

      '</div>';
  };

  window._addBuzzItem = function () {
    var d    = CS.get();
    var arr  = (d && d.whatsNew && d.whatsNew.buzzItems) || [];
    var next = arr.length + 1;
    CS.addItem('whatsNew.buzzItems', {
      id:       'buzz-' + String(next).padStart(3, '0'),
      age:      'Latest',
      isNew:    true,
      headline: '',
      body:     '',
      benefits: [],
    });
    window.markDraft && window.markDraft('whatsnew');
    window.renderWhatsNew();
  };

  // ---------------------------------------------------------------------------
  // Drawer save — routes to current panel's save function
  // ---------------------------------------------------------------------------

  window.saveDrawer = function () {
    if (typeof window._saveDrawerCurrentFn === 'function') {
      window._saveDrawerCurrentFn();
    } else {
      closeDrawer();
    }
  };

  // ---------------------------------------------------------------------------
  // No-data fallback
  // ---------------------------------------------------------------------------

  function _noData(id) {
    document.getElementById(id).innerHTML =
      '<div class="access-denied"><div class="ad-icon">\u23F3</div>' +
      '<h3>Loading content\u2026</h3>' +
      '<p>Fetching draft from the API. If this persists, check the Flask server is running.</p></div>';
  }

}(window));
