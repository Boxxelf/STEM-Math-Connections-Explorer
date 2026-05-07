document.addEventListener('DOMContentLoaded', () => {
    const svg = d3.select('#chart');
    const container = d3.select('.chart-container');
    const tooltip = d3.select('.tooltip');
    const rationaleDisplay = d3.select('#rationale-display');
    const rationaleTitle = d3.select('#rationale-title');
    const rationaleLevel = d3.select('#rationale-level');
    const rationaleContent = d3.select('#rationale-content');
    const emptyState = d3.select('#empty-selection');
    const instructionsOverlay = d3.select('#instructions-overlay');
    const instructionsOpenBtn = d3.select('#instructions-open');
    const instructionsCloseBtn = d3.select('#instructions-close');
    const instructionsDismissBtn = d3.select('#instructions-dismiss');
    const courseSummary = d3.select('#course-selection-summary');
    const csTopicClearBtn = d3.select('#cs-topic-clear');

    // Elements for the new calc-topic list view
    const calcListContainer = d3.select('#calc-topic-list');
    const calcListEmpty = d3.select('#calc-list-empty');
    const csSelectionSummary = d3.select('#cs-selection-summary');
    const listTab = d3.select('#calc-list-tab');
    const mapTab = d3.select('#full-map-tab');
    const calcListPanel = d3.select('#calc-list-panel');
    const chartPanel = d3.select('#chart-panel');
    const connectionThresholdInput = d3.select('#connection-threshold');
    const connectionThresholdValue = d3.select('#connection-threshold-value');
    const calcSortModeSelect = d3.select('#calc-sort-mode');

    const calcBookTooltip = (() => {
        const el = document.createElement('div');
        el.className = 'calc-book-tooltip';
        el.setAttribute('role', 'tooltip');
        el.setAttribute('aria-hidden', 'true');
        document.body.appendChild(el);
        return d3.select(el);
    })();

    const TEXTBOOK_DISPLAY_ORDER = [
        'Stewart 9th',
        'Active Calculus',
        'OpenStax',
        'Rogawski',
        'Briggs'
    ];

    const TEXTBOOK_PURCHASE_LINKS = {
        'Stewart 9th': 'https://www.amazon.com/dp/1337613924',
        'Active Calculus': 'https://www.amazon.com/dp/1724458329',
        OpenStax: 'https://www.amazon.com/dp/1506698050',
        Rogawski: 'https://www.amazon.com/dp/1319050740',
        Briggs: 'https://www.amazon.com/dp/0134763645'
    };

    const CALC_BOOK_NO_MAPPING_HTML =
        '<div class="calc-book-tooltip-empty">No textbook mapping</div>';

    const CALC_BOOK_ICON_SVG =
        '<svg class="calc-topic-textbook-icon" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>';

    function isTextbookCellEmpty(value) {
        if (value == null) {
            return true;
        }
        const s = String(value).trim();
        if (!s) {
            return true;
        }
        return /^n\/a$/i.test(s);
    }

    function escapeHtmlForTooltip(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function buildTextbookReferenceTooltipHtml(textbooks) {
        if (!textbooks) {
            return '';
        }
        const parts = [];
        TEXTBOOK_DISPLAY_ORDER.forEach((key) => {
            const text = textbooks[key];
            if (!isTextbookCellEmpty(text)) {
                const body = escapeHtmlForTooltip(text)
                    .replace(/\r\n/g, '\n')
                    .split('\n')
                    .join('<br>');
                const buyUrl = TEXTBOOK_PURCHASE_LINKS[key];
                const buyHtml = buyUrl
                    ? `<a class="calc-book-tooltip-buy" href="${escapeHtmlForTooltip(
                          buyUrl
                      )}" target="_blank" rel="noopener noreferrer">View on Amazon</a>`
                    : '';
                parts.push(
                    `<div class="calc-book-tooltip-section"><div class="calc-book-tooltip-heading">${escapeHtmlForTooltip(
                        key
                    )}</div>${buyHtml}<div class="calc-book-tooltip-text">${body}</div></div>`
                );
            }
        });
        return parts.join('');
    }

    function hideCalcBookTooltip() {
        if (calcBookHideTimer) {
            clearTimeout(calcBookHideTimer);
            calcBookHideTimer = null;
        }
        calcBookTooltip.classed('is-visible', false).attr('aria-hidden', 'true');
    }

    let calcBookHideTimer = null;
    function scheduleHideCalcBookTooltip() {
        if (calcBookHideTimer) {
            clearTimeout(calcBookHideTimer);
        }
        calcBookHideTimer = window.setTimeout(() => {
            calcBookHideTimer = null;
            hideCalcBookTooltip();
        }, 180);
    }
    function cancelHideCalcBookTooltip() {
        if (calcBookHideTimer) {
            clearTimeout(calcBookHideTimer);
            calcBookHideTimer = null;
        }
    }

    calcBookTooltip
        .on('mouseenter', cancelHideCalcBookTooltip)
        .on('mouseleave', scheduleHideCalcBookTooltip)
        .on('mousedown', cancelHideCalcBookTooltip);

    function positionCalcBookTooltip(anchorEl) {
        const rect = anchorEl.getBoundingClientRect();
        const tooltipNode = calcBookTooltip.node();
        const margin = 10;
        const pad = 8;
        let left = rect.right + margin;
        let top = rect.top + rect.height / 2;
        const tw = tooltipNode.offsetWidth;
        const th = tooltipNode.offsetHeight;
        top -= th / 2;
        if (left + tw > window.innerWidth - pad) {
            left = rect.left - tw - margin;
        }
        if (left < pad) {
            left = pad;
        }
        if (top < pad) {
            top = pad;
        }
        if (top + th > window.innerHeight - pad) {
            top = window.innerHeight - th - pad;
        }
        calcBookTooltip
            .style('position', 'fixed')
            .style('left', `${left}px`)
            .style('top', `${top}px`)
            .style('z-index', '10000');
    }

    function showCalcBookTooltip(html, anchorEl) {
        calcBookTooltip.html(html).classed('is-visible', true).attr('aria-hidden', 'false');
        requestAnimationFrame(() => {
            positionCalcBookTooltip(anchorEl);
        });
    }

    const containerRect = container.node().getBoundingClientRect();
    const state = {
        width: containerRect.width,
        height: containerRect.height,
        nodes: [],
        edges: [],
        nodeById: new Map(),
        zoom: null,
        zoomLayer: null,
        simulation: null,
        linkSelection: null,
        nodeSelection: null,
        circleSelection: null,
        topicLookupByName: new Map(),
        topicMetaByCode: new Map(),
        calculusHierarchy: new Map(),
        nodeIdByTopicCode: new Map(),
        allCourses: [],
        selectedCourses: new Set(),
        selectedNodeId: null,
        incomingNodeIds: new Set(),
        outgoingNodeIds: new Set(),
        selectedCSTopics: new Map(),
        csHighlightLevels: new Map(),
        calcConnectionsByNodeId: new Map(),
        connectionThreshold: 1,
        calcSortMode: 'default',
        expandedCalcPrereqIds: new Set(),
        showFullMap: true,
        maxDegree: 0,
        activeTopicCode: null,
        initialFitDone: false
    };

    function getChartLayoutRect() {
        const panelNode = chartPanel.node();
        if (state.showFullMap && panelNode && chartPanel.classed('hidden') === false) {
            const r = panelNode.getBoundingClientRect();
            if (r.width >= 2 && r.height >= 2) {
                return r;
            }
        }
        return container.node().getBoundingClientRect();
    }

    function applyChartDimensions() {
        const rect = getChartLayoutRect();
        state.width = rect.width;
        state.height = rect.height;
        if (state.width < 8 || state.height < 8) {
            const vw = window.innerWidth || document.documentElement.clientWidth || 320;
            const vh = window.innerHeight || document.documentElement.clientHeight || 568;
            state.width = Math.max(120, vw - 28);
            state.height = Math.max(220, Math.floor(vh * 0.4));
        }
        svg.attr('width', state.width).attr('height', state.height);
        if (state.simulation) {
            state.simulation.force('center', d3.forceCenter(state.width / 2, state.height / 2));
        }
    }

    svg.attr('width', state.width).attr('height', state.height);

    const defs = svg.append('defs');

    const gradientCalcI = defs.append('radialGradient').attr('id', 'gradient-calc-i');
    gradientCalcI.append('stop').attr('offset', '0%').attr('stop-color', '#5DADE2').attr('stop-opacity', 1);
    gradientCalcI.append('stop').attr('offset', '100%').attr('stop-color', '#2874A6').attr('stop-opacity', 1);

    const gradientCalcII = defs.append('radialGradient').attr('id', 'gradient-calc-ii');
    gradientCalcII.append('stop').attr('offset', '0%').attr('stop-color', '#82E0AA').attr('stop-opacity', 1);
    gradientCalcII.append('stop').attr('offset', '100%').attr('stop-color', '#239B56').attr('stop-opacity', 1);

    const arrowMarker = defs.append('marker')
        .attr('id', 'arrowhead')
        .attr('viewBox', '0 0 10 10')
        .attr('refX', 22)
        .attr('refY', 5)
        .attr('markerWidth', 12)
        .attr('markerHeight', 12)
        .attr('orient', 'auto')
        .attr('markerUnits', 'userSpaceOnUse');

    arrowMarker.append('path')
        .attr('d', 'M0,0 L10,5 L0,10 L2,5 Z')
        .attr('fill', '#64748b')
        .attr('stroke', '#475569')
        .attr('stroke-width', '0.5')
        .attr('opacity', 0.7);

    const zoomLayer = svg.append('g').attr('class', 'zoom-layer');
    const linkLayer = zoomLayer.append('g').attr('class', 'links');
    const nodeLayer = zoomLayer.append('g').attr('class', 'nodes');

    state.zoomLayer = zoomLayer;

    const zoomBehaviour = d3.zoom()
        .scaleExtent([0.4, 4])
        .on('zoom', (event) => {
            state.zoomLayer.attr('transform', event.transform);
        });

    state.zoom = zoomBehaviour;
    svg.call(zoomBehaviour);

    if (!instructionsOverlay.empty()) {
        const hideInstructions = () => instructionsOverlay.classed('hidden', true);
        instructionsOpenBtn.on('click', () => instructionsOverlay.classed('hidden', false));
        instructionsCloseBtn.on('click', hideInstructions);
        instructionsDismissBtn.on('click', hideInstructions);
    }

    // View mode tabs: Full calculus concept map vs Connected calculus list
    if (!listTab.empty() && !mapTab.empty() && !calcListPanel.empty() && !chartPanel.empty()) {
        listTab.on('click', () => {
            state.showFullMap = false;
            listTab.classed('active', true);
            mapTab.classed('active', false);
            calcListPanel.classed('hidden', false);
            chartPanel.classed('hidden', true);
            requestAnimationFrame(() => {
                applyChartDimensions();
                if (state.simulation) {
                    state.simulation.alpha(0.15).restart();
                }
            });
        });

        mapTab.on('click', () => {
            state.showFullMap = true;
            listTab.classed('active', false);
            mapTab.classed('active', true);
            calcListPanel.classed('hidden', true);
            chartPanel.classed('hidden', false);
            requestAnimationFrame(() => {
                applyChartDimensions();
                if (state.simulation) {
                    state.simulation.alpha(0.3).restart();
                }
                if (state.initialFitDone) {
                    fitGraphToView({ animate: true });
                }
            });
        });
    }

    // Filters for the calc-topic list
    if (!connectionThresholdInput.empty() && !connectionThresholdValue.empty()) {
        connectionThresholdInput.on('input', (event) => {
            const value = Number(event.target.value) || 1;
            state.connectionThreshold = value;
            connectionThresholdValue.text(String(value));
            renderCalcTopicList();
        });
    }

    if (!calcSortModeSelect.empty()) {
        calcSortModeSelect.on('change', (event) => {
            state.calcSortMode = event.target.value || 'default';
            renderCalcTopicList();
        });
    }

    if (!csTopicClearBtn.empty()) {
        csTopicClearBtn.on('click', () => {
            clearSelectedCSTopics();
            updateCSHighlights();
            updateNodeStyling();
            if (state.selectedNodeId) {
                const selectedNode = state.nodeById.get(state.selectedNodeId);
                if (selectedNode) {
                    showRationale(selectedNode);
                }
            }
        });
    }

    function dataUrl(relativePath) {
        try {
            return new URL(relativePath, window.location.href).href;
        } catch (e) {
            return relativePath;
        }
    }

    /** iOS WKWebView: native app injects Base64 at document start (fetch to file:// often fails). */
    function utf8FromBase64(b64) {
        var bin = atob(b64);
        var bytes = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return new TextDecoder('utf-8').decode(bytes);
    }
    function bundleGraphFromIOS() {
        var s = window.__CCE_GRAPH_B64;
        if (!s) return null;
        try {
            return JSON.parse(utf8FromBase64(s));
        } catch (e) {
            console.warn('__CCE_GRAPH_B64 decode failed', e);
            return null;
        }
    }
    function bundleTextFromIOS(key) {
        var s = window[key];
        if (!s) return null;
        try {
            return utf8FromBase64(s);
        } catch (e) {
            console.warn(key + ' decode failed', e);
            return null;
        }
    }

    var _cceG = bundleGraphFromIOS();
    var _cceCalc = bundleTextFromIOS('__CCE_CALC_CSV_B64');
    var _cceCS = bundleTextFromIOS('__CCE_CS_TOPICS_CSV_B64');

    Promise.all([
        _cceG != null ? Promise.resolve(_cceG) : d3.json(dataUrl('graph_data.json')),
        _cceCalc != null ? Promise.resolve(_cceCalc) : d3.text(dataUrl('Calculus topic list-Table 1.csv')),
        _cceCS != null ? Promise.resolve(_cceCS) : d3.text(dataUrl('CS topic lists-Table 1.csv'))
    ]).then(([graph, calculusCsvText, csTopicsCsvText]) => {
        if (!graph) {
            throw new Error('Graph data missing');
        }

        const calculusItems = parseCalculusCsv(calculusCsvText);
        const topicLookup = buildTopicLookup(calculusItems);
        const csTopicsList = parseCSTopicsCsv(csTopicsCsvText);

        state.topicLookupByName = topicLookup.byName;
        state.topicMetaByCode = topicLookup.byCode;
        state.calculusHierarchy = topicLookup.hierarchy;
        state.allCourses = Array.from(topicLookup.hierarchy.keys());
        state.csTopicsList = csTopicsList;

        initializeGraph(graph);
        renderCalculusTree(state.calculusHierarchy);
        renderCSTopicTree(state.nodes, csTopicsList);
        updateCourseSummary();
        updateCsSelectionSummary();
        applyCourseFilter();
        recomputeCalcConnections();
        updateNodeStyling();

        // WKWebView / mobile: layout size is often 0 at DOMContentLoaded; remeasure after paint.
        function kickChartLayout(animate) {
            applyChartDimensions();
            if (state.simulation) {
                state.simulation.force('center', d3.forceCenter(state.width / 2, state.height / 2));
                state.simulation.alpha(0.25).restart();
            }
            fitGraphToView({ animate: animate });
            state.initialFitDone = true;
        }
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                kickChartLayout(false);
                if (state.width < 8 || state.height < 8) {
                    [50, 200, 600].forEach((ms) => window.setTimeout(() => kickChartLayout(ms === 600), ms));
                }
            });
        });
        window.setTimeout(() => kickChartLayout(true), 900);
    }).catch((error) => {
        console.error('Error loading visualization data:', error);
        alert('An error occurred while loading the visualization. Please check the console for details.');
    });

    svg.on('click', (event) => {
        const isNode = event.target.closest ? event.target.closest('.node') : null;
        if (!isNode) {
            resetCalculusSelection({ shouldRefit: true });
        }
    });

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', hideCalcBookTooltip, true);

    function initializeGraph(graph) {
        state.nodes = graph.nodes.map((node) => ({ ...node }));
        state.edges = graph.edges.map((edge) => ({ ...edge }));

        state.nodes.forEach((node) => {
            // Check for special mappings first (nodes 27, 28, 20, 24)
            let specialMapping = null;
            if (node.number_id) {
                specialMapping = getSpecialTopicMapping(node.label, node.number_id);
            }

            if (specialMapping) {
                // Apply special mapping directly
                node.topicCode = specialMapping.topicCode;
                node.topicName = specialMapping.topicName;
                node.course = specialMapping.course || node.calc_level;
                node.coreIdea = specialMapping.coreIdea;
                state.nodeIdByTopicCode.set(specialMapping.topicCode, node.id);
            } else {
                // Try normal lookup
                const normalizedLabel = normalizeText(node.label);
                const lookupMatch = state.topicLookupByName.get(normalizedLabel);

                if (lookupMatch) {
                    node.topicCode = lookupMatch.topicCode;
                    node.topicName = lookupMatch.topicName;
                    node.course = lookupMatch.course || node.calc_level;
                    node.coreIdea = lookupMatch.coreIdea;
                    state.nodeIdByTopicCode.set(lookupMatch.topicCode, node.id);
                } else {
                    node.topicCode = node.number_id != null ? String(node.number_id) : node.id;
                    node.topicName = node.label;
                    node.course = node.calc_level || 'Course';
                    console.warn('Topic mapping not found for:', node.label);
                }
            }

            state.nodeById.set(node.id, node);
            node.isCourseVisible = true;
        });

        const degreeMap = new Map();
        state.edges.forEach((edge) => {
            degreeMap.set(edge.source, (degreeMap.get(edge.source) || 0) + 1);
            degreeMap.set(edge.target, (degreeMap.get(edge.target) || 0) + 1);
        });

        state.nodes.forEach((node) => {
            node.degree = degreeMap.get(node.id) || 0;
        });

        state.maxDegree = d3.max(state.nodes, (node) => node.degree) || 1;

        if (state.allCourses.length === 0) {
            state.allCourses = Array.from(new Set(state.nodes.map((node) => node.course || node.calc_level).filter(Boolean)));
        }

        state.selectedCourses = new Set(state.allCourses);

        state.linkSelection = linkLayer.selectAll('line')
            .data(state.edges)
            .enter()
            .append('line')
            .attr('class', 'link');

        state.nodeSelection = nodeLayer.selectAll('g')
            .data(state.nodes, (d) => d.id)
            .enter()
            .append('g')
            .attr('class', 'node')
            .call(dragBehaviour());

        state.circleSelection = state.nodeSelection.append('circle')
            .attr('class', (d) => {
                const level = (d.course || d.calc_level || '').replace(/\s+/g, '-').toLowerCase();
                if (level === 'calculus-i') {
                    return 'node-circle calc-i';
                }
                if (level === 'calculus-ii') {
                    return 'node-circle calc-ii';
                }
                return 'node-circle';
            })
            .attr('r', (d) => computeNodeRadius(d));

        state.nodeSelection.append('text')
            .attr('class', 'node-label')
            .attr('x', 14)
            .attr('y', 5)
            .text((d) => d.topicCode || d.number_id || d.id);

        state.nodeSelection
            .on('mouseover', (event, nodeData) => {
                tooltip.transition().duration(80).style('opacity', 0.95);
                tooltip.html(`<strong>${nodeData.topicName || nodeData.label}</strong>`)
                    .style('left', `${event.pageX + 12}px`)
                    .style('top', `${event.pageY - 28}px`);
            })
            .on('mouseout', () => {
                tooltip.transition().duration(200).style('opacity', 0);
            })
            .on('click', (event, nodeData) => {
                event.stopPropagation();
                selectCalculusNode(nodeData);
            });

        state.simulation = d3.forceSimulation(state.nodes)
            .force('link', d3.forceLink(state.edges).id((d) => d.id).distance(200))
            .force('charge', d3.forceManyBody().strength(-720))
            .force('center', d3.forceCenter(state.width / 2, state.height / 2))
            .force('collision', d3.forceCollide().radius((d) => computeNodeRadius(d) + 22))
            .alphaDecay(0.025)
            .on('tick', () => {
                state.linkSelection
                    .attr('x1', (d) => d.source.x)
                    .attr('y1', (d) => d.source.y)
                    .attr('x2', (d) => d.target.x)
                    .attr('y2', (d) => d.target.y);

                state.nodeSelection.attr('transform', (d) => `translate(${d.x},${d.y})`);
            });
    }

    function dragBehaviour() {
        function dragstarted(event, nodeData) {
            if (!event.active && state.simulation) {
                state.simulation.alphaTarget(0.3).restart();
            }
            nodeData.fx = nodeData.x;
            nodeData.fy = nodeData.y;
        }

        function dragged(event, nodeData) {
            nodeData.fx = event.x;
            nodeData.fy = event.y;
        }

        function dragended(event, nodeData) {
            if (!event.active && state.simulation) {
                state.simulation.alphaTarget(0);
            }
            if (nodeData.id !== state.selectedNodeId) {
                nodeData.fx = null;
                nodeData.fy = null;
            }
        }

        return d3.drag().on('start', dragstarted).on('drag', dragged).on('end', dragended);
    }

    function parseCalculusCsv(rawText) {
        if (!rawText) {
            return [];
        }

        let text = rawText.replace(/^\uFEFF/, '');
        const firstBreak = text.indexOf('\n');
        const firstLine = firstBreak >= 0 ? text.slice(0, firstBreak).trim() : text.trim();
        if (/^table/i.test(firstLine)) {
            text = firstBreak >= 0 ? text.slice(firstBreak + 1) : '';
        }

        const rows = d3.csvParse(text.trim());
        if (!rows || !rows.length) {
            return [];
        }

        return rows
            .map((row) => {
                const course = (row.Course || '').trim();
                const coreIdea = (row['Core Idea'] || '').trim();
                const topicCode = (row['Topic Code'] || '').trim();
                const topicName = (row['Topic Name'] || '').trim();
                const textbooks = {};
                TEXTBOOK_DISPLAY_ORDER.forEach((key) => {
                    const cell = row[key];
                    textbooks[key] = cell != null ? String(cell).trim() : '';
                });
                return {
                    course,
                    coreIdea,
                    topicCode,
                    topicName,
                    textbooks
                };
            })
            .filter((item) => item.course && item.coreIdea && item.topicCode && item.topicName);
    }

    function buildTopicLookup(items) {
        const byName = new Map();
        const byCode = new Map();
        const hierarchy = new Map();

        items.forEach((item) => {
            const normalized = normalizeText(item.topicName);
            if (!byName.has(normalized)) {
                byName.set(normalized, item);
            }
            byCode.set(item.topicCode, item);

            if (!hierarchy.has(item.course)) {
                hierarchy.set(item.course, {
                    course: item.course,
                    coreIdeas: new Map()
                });
            }

            const courseEntry = hierarchy.get(item.course);
            if (!courseEntry.coreIdeas.has(item.coreIdea)) {
                courseEntry.coreIdeas.set(item.coreIdea, []);
            }
            courseEntry.coreIdeas.get(item.coreIdea).push(item);
        });

        return { byName, byCode, hierarchy };
    }

    function normalizeText(text) {
        if (!text) {
            return '';
        }
        return text
            .toLowerCase()
            .replace(/&/g, 'and')
            .replace(/[’'`]/g, '')
            .replace(/[^a-z0-9\s]/g, ' ')
            .replace(/\b(of|the|and|with|using|for|to|a|an|into|toward|towards|functions?)\b/g, ' ')
            .replace(/\s+/g, '')
            .trim();
    }

    // Special mappings for nodes with slight name differences
    function getSpecialTopicMapping(nodeLabel, numberId) {
        // Handle number_id 24 which has two different nodes
        if (numberId === 24) {
            const labelLower = nodeLabel ? nodeLabel.toLowerCase() : '';
            if (labelLower.includes('sketching') || labelLower.includes('graphing')) {
                // Node Z: Sketching/graphing functions -> Der15
                return {
                    topicCode: 'Der15',
                    topicName: 'Graphing with derivatives',
                    course: 'Calculus I',
                    coreIdea: 'Derivatives'
                };
            } else {
                // Node P: Linear approximation -> Der11
                return {
                    topicCode: 'Der11',
                    topicName: 'Linear approximations',
                    course: 'Calculus I',
                    coreIdea: 'Derivatives'
                };
            }
        }

        // Handle number_id 19 which has two different nodes
        if (numberId === 19) {
            const labelLower = nodeLabel ? nodeLabel.toLowerCase() : '';
            if (labelLower.includes('chain')) {
                // The chain rule -> Der7
                return {
                    topicCode: 'Der7',
                    topicName: 'The chain rule',
                    course: 'Calculus I',
                    coreIdea: 'Derivatives'
                };
            } else if (labelLower.includes('related')) {
                // Related rates -> Der10
                return {
                    topicCode: 'Der10',
                    topicName: 'Related rates',
                    course: 'Calculus I',
                    coreIdea: 'Derivatives'
                };
            }
        }

        // Handle number_id 26 which has two different nodes
        if (numberId === 26) {
            const labelLower = nodeLabel ? nodeLabel.toLowerCase() : '';
            if (labelLower.includes('shape') || labelLower.includes('concavity')) {
                // The shape of graphs and concavity -> Der14
                return {
                    topicCode: 'Der14',
                    topicName: 'The shape of graphs and concavity',
                    course: 'Calculus I',
                    coreIdea: 'Derivatives'
                };
            } else if (labelLower.includes('optimization')) {
                // Optimization -> Der17
                return {
                    topicCode: 'Der17',
                    topicName: 'Optimization',
                    course: 'Calculus I',
                    coreIdea: 'Derivatives'
                };
            }
        }

        // Handle number_id 22 which has two different nodes
        if (numberId === 22) {
            const labelLower = nodeLabel ? nodeLabel.toLowerCase() : '';
            if (labelLower.includes('mean value')) {
                // The mean value theorem -> Der13
                return {
                    topicCode: 'Der13',
                    topicName: 'The mean value theorem',
                    course: 'Calculus I',
                    coreIdea: 'Derivatives'
                };
            } else if (labelLower.includes('inverse trigonometric')) {
                // Integrals involving inverse trigonometric functions -> Int13
                return {
                    topicCode: 'Int13',
                    topicName: 'Inverse trigonometric integrals',
                    course: 'Calculus I',
                    coreIdea: 'Integrals'
                };
            }
        }

        // Handle number_id 29 which has two different nodes
        if (numberId === 29) {
            const labelLower = nodeLabel ? nodeLabel.toLowerCase() : '';
            if (labelLower.includes('implicit')) {
                // Implicit differentiation -> Der8
                return {
                    topicCode: 'Der8',
                    topicName: 'Implicit differentiation',
                    course: 'Calculus I',
                    coreIdea: 'Derivatives'
                };
            } else if (labelLower.includes('integrals') || labelLower.includes('area')) {
                // Motivating the need for integrals and approximating the area under curves -> Int2
                return {
                    topicCode: 'Int2',
                    topicName: 'Introduction to integrals and area approximation',
                    course: 'Calculus I',
                    coreIdea: 'Integrals'
                };
            }
        }

        // Handle number_id 30 which has two different nodes
        if (numberId === 30) {
            const labelLower = nodeLabel ? nodeLabel.toLowerCase() : '';
            if (labelLower.includes('newton')) {
                // Newtons method -> Der18
                return {
                    topicCode: 'Der18',
                    topicName: "Newton's method",
                    course: 'Calculus I',
                    coreIdea: 'Derivatives'
                };
            } else if (labelLower.includes('definite')) {
                // Definite integrals -> Int3
                return {
                    topicCode: 'Int3',
                    topicName: 'Definite integrals',
                    course: 'Calculus I',
                    coreIdea: 'Integrals'
                };
            }
        }

        const specialMappings = {
            // Calculus I - Limits and Continuity
            1: { // Motivating the need for calculus & limits -> Lim1
                topicCode: 'Lim1',
                topicName: 'Introduction to calculus and limits',
                course: 'Calculus I',
                coreIdea: 'Limits and Continuity'
            },
            2: { // Introducing the limit concept -> Lim2
                topicCode: 'Lim2',
                topicName: 'The limit concept',
                course: 'Calculus I',
                coreIdea: 'Limits and Continuity'
            },
            3: { // Determining limits of functions graphically and numerically -> Lim3
                topicCode: 'Lim3',
                topicName: 'Graphical and numerical limits',
                course: 'Calculus I',
                coreIdea: 'Limits and Continuity'
            },
            4: { // Determining the limits of functions with limit laws -> Lim4
                topicCode: 'Lim4',
                topicName: 'Limit laws',
                course: 'Calculus I',
                coreIdea: 'Limits and Continuity'
            },
            6: { // Limits at infinity and infinite limits -> Lim6
                topicCode: 'Lim6',
                topicName: 'Limits at infinity and infinite limits',
                course: 'Calculus I',
                coreIdea: 'Limits and Continuity'
            },
            7: { // Epsilon-delta definition of the limit -> Lim5
                topicCode: 'Lim5',
                topicName: 'Epsilon-delta definition of the limit',
                course: 'Calculus I',
                coreIdea: 'Limits and Continuity'
            },
            8: { // Continuity, discontinuities, and the intermediate value theorem -> Lim7
                topicCode: 'Lim7',
                topicName: 'Continuity and the intermediate value theorem',
                course: 'Calculus I',
                coreIdea: 'Limits and Continuity'
            },
            // Calculus I - Derivatives
            9: { // Motivating the need for the derivative and introducing the derivative concept -> Der1
                topicCode: 'Der1',
                topicName: 'Introduction to derivatives',
                course: 'Calculus I',
                coreIdea: 'Derivatives'
            },
            10: { // Defining the derivative as a function -> Der2
                topicCode: 'Der2',
                topicName: 'Derivatives as functions',
                course: 'Calculus I',
                coreIdea: 'Derivatives'
            },
            11: { // Basic differentiation rules -> Der3
                topicCode: 'Der3',
                topicName: 'Basic differentiation rules',
                course: 'Calculus I',
                coreIdea: 'Derivatives'
            },
            12: { // Product and quotient rules -> Der4
                topicCode: 'Der4',
                topicName: 'The product and quotient rules',
                course: 'Calculus I',
                coreIdea: 'Derivatives'
            },
            14: { // Trigonometric derivatives -> Der5
                topicCode: 'Der5',
                topicName: 'Trigonometric derivatives',
                course: 'Calculus I',
                coreIdea: 'Derivatives'
            },
            16: { // Derivatives of logarithmic and exponential functions -> Der6
                topicCode: 'Der6',
                topicName: 'Logarithmic and exponential derivatives',
                course: 'Calculus I',
                coreIdea: 'Derivatives'
            },
            18: { // Applications of derivatives: rates of change and exponential models -> Der9
                topicCode: 'Der9',
                topicName: 'Rates of change and exponential models',
                course: 'Calculus I',
                coreIdea: 'Derivatives'
            },
            25: { // Extreme values -> Der12
                topicCode: 'Der12',
                topicName: 'Extreme values',
                course: 'Calculus I',
                coreIdea: 'Derivatives'
            },
            27: { // L'Hopitals rule -> Der16
                topicCode: 'Der16',
                topicName: "L'Hôpital's rule",
                course: 'Calculus I',
                coreIdea: 'Derivatives'
            },
            // Calculus I - Integrals
            20: { // Hyperbolic functions -> Int12 (Note: graph_data.json says Calculus II, but CSV says Calculus I)
                topicCode: 'Int12',
                topicName: 'Hyperbolic functions',
                course: 'Calculus I', // Using CSV data, not graph_data.json calc_level
                coreIdea: 'Integrals'
            },
            21: { // Integration with the substitution rule -> Int7
                topicCode: 'Int7',
                topicName: 'Integration by substitution',
                course: 'Calculus I',
                coreIdea: 'Integrals'
            },
            28: { // Antiderivatives -> Int1
                topicCode: 'Int1',
                topicName: 'Antiderivatives',
                course: 'Calculus I',
                coreIdea: 'Integrals'
            },
            31: { // The fundamental theorem of calculus -> Int4
                topicCode: 'Int4',
                topicName: 'The fundamental theorem of calculus',
                course: 'Calculus I',
                coreIdea: 'Integrals'
            },
            32: { // Indefinite integrals and the net change theorem -> Int5
                topicCode: 'Int5',
                topicName: 'Indefinite integrals and the net change theorem',
                course: 'Calculus I',
                coreIdea: 'Integrals'
            },
            33: { // Integrals of exponential and logarithmic functions -> Int6
                topicCode: 'Int6',
                topicName: 'Logarithmic and exponential integrals',
                course: 'Calculus I',
                coreIdea: 'Integrals'
            },
            38: { // Using integrals to find the area between two curves -> Int8
                topicCode: 'Int8',
                topicName: 'Area between curves',
                course: 'Calculus I',
                coreIdea: 'Integrals'
            },
            40: { // Using integrals to find the volume of solids of revolution -> Int9
                topicCode: 'Int9',
                topicName: 'Volume of solids of revolution',
                course: 'Calculus I',
                coreIdea: 'Integrals'
            },
            41: { // Using integrals for physical applications -> Int10
                topicCode: 'Int10',
                topicName: 'Physical applications of integrals',
                course: 'Calculus I',
                coreIdea: 'Integrals'
            },
            43: { // Using integrals to find arc length and surface area -> Int11
                topicCode: 'Int11',
                topicName: 'Arc length and surface area',
                course: 'Calculus I',
                coreIdea: 'Integrals'
            },
            // Calculus II - Advanced integration
            13: { // Integration by parts -> AdvInt1
                topicCode: 'AdvInt1',
                topicName: 'Integration by parts',
                course: 'Calculus II',
                coreIdea: 'Advanced integration'
            },
            48: { // Trigonometric integrals -> AdvInt2
                topicCode: 'AdvInt2',
                topicName: 'Trigonometric integrals',
                course: 'Calculus II',
                coreIdea: 'Advanced integration'
            },
            49: { // Trigonometric substitutions -> AdvInt3
                topicCode: 'AdvInt3',
                topicName: 'Trigonometric substitutions',
                course: 'Calculus II',
                coreIdea: 'Advanced integration'
            },
            50: { // Integration using the method of partial fractions -> AdvInt4
                topicCode: 'AdvInt4',
                topicName: 'Integration by partial fractions',
                course: 'Calculus II',
                coreIdea: 'Advanced integration'
            },
            51: { // General integration strategies and approaches -> AdvInt5
                topicCode: 'AdvInt5',
                topicName: 'Integration strategies',
                course: 'Calculus II',
                coreIdea: 'Advanced integration'
            },
            52: { // Integration using tables, technology, and numerical approaches -> AdvInt6
                topicCode: 'AdvInt6',
                topicName: 'Numerical and table-based integration',
                course: 'Calculus II',
                coreIdea: 'Advanced integration'
            },
            53: { // Improper integrals -> AdvInt7
                topicCode: 'AdvInt7',
                topicName: 'Improper integrals',
                course: 'Calculus II',
                coreIdea: 'Advanced integration'
            },
            54: { // Application to probability -> AdvInt8
                topicCode: 'AdvInt8',
                topicName: 'Probability applications',
                course: 'Calculus II',
                coreIdea: 'Advanced integration'
            },
            55: { // Application to physics -> AdvInt9
                topicCode: 'AdvInt9',
                topicName: 'Advanced physical applications',
                course: 'Calculus II',
                coreIdea: 'Advanced integration'
            },
            56: { // Application to economics -> AdvInt10
                topicCode: 'AdvInt10',
                topicName: 'Economics applications',
                course: 'Calculus II',
                coreIdea: 'Advanced integration'
            },
            // Calculus II - Differential Equations
            57: { // Introducing the concept of differential equations -> DiffEq1
                topicCode: 'DiffEq1',
                topicName: 'Introduction to differential equations',
                course: 'Calculus II',
                coreIdea: 'Differential Equations'
            },
            58: { // Direction fields and Eulers method -> DiffEq2
                topicCode: 'DiffEq2',
                topicName: "Direction fields and Euler's method",
                course: 'Calculus II',
                coreIdea: 'Differential Equations'
            },
            59: { // Separable differential equations -> DiffEq3
                topicCode: 'DiffEq3',
                topicName: 'Separable differential equations',
                course: 'Calculus II',
                coreIdea: 'Differential Equations'
            },
            60: { // Modeling with differential equations -> DiffEq4
                topicCode: 'DiffEq4',
                topicName: 'Modeling with differential equations',
                course: 'Calculus II',
                coreIdea: 'Differential Equations'
            },
            61: { // Special first-order linear differential equations -> DiffEq5
                topicCode: 'DiffEq5',
                topicName: 'Special first-order linear differential equations',
                course: 'Calculus II',
                coreIdea: 'Differential Equations'
            },
            // Calculus II - Sequences and Series
            5: { // Sequences -> SeqSer1
                topicCode: 'SeqSer1',
                topicName: 'Sequences',
                course: 'Calculus II',
                coreIdea: 'Sequences and Series'
            },
            17: { // Taylor series -> SeqSer7
                topicCode: 'SeqSer7',
                topicName: 'Taylor series',
                course: 'Calculus II',
                coreIdea: 'Sequences and Series'
            },
            63: { // Series -> SeqSer2
                topicCode: 'SeqSer2',
                topicName: 'Series',
                course: 'Calculus II',
                coreIdea: 'Sequences and Series'
            },
            64: { // Convergence and divergence -> SeqSer3
                topicCode: 'SeqSer3',
                topicName: 'Convergence and divergence',
                course: 'Calculus II',
                coreIdea: 'Sequences and Series'
            },
            65: { // Comparison tests -> SeqSer4
                topicCode: 'SeqSer4',
                topicName: 'Comparison tests',
                course: 'Calculus II',
                coreIdea: 'Sequences and Series'
            },
            66: { // The ratio and root tests -> SeqSer5
                topicCode: 'SeqSer5',
                topicName: 'The ratio and root tests',
                course: 'Calculus II',
                coreIdea: 'Sequences and Series'
            },
            67: { // Alternating series -> SeqSer6
                topicCode: 'SeqSer6',
                topicName: 'Alternating series',
                course: 'Calculus II',
                coreIdea: 'Sequences and Series'
            },
            69: { // Power series and functions -> SeqSer8
                topicCode: 'SeqSer8',
                topicName: 'Power series and functions',
                course: 'Calculus II',
                coreIdea: 'Sequences and Series'
            },
            // Calculus II - Parametric Equations and Polar Coordinates
            15: { // Polar coordinates -> ParamPol2
                topicCode: 'ParamPol2',
                topicName: 'Polar coordinates',
                course: 'Calculus II',
                coreIdea: 'Parametric Equations and Polar Coordinates'
            },
            23: { // Parametric equations -> ParamPol1
                topicCode: 'ParamPol1',
                topicName: 'Parametric equations',
                course: 'Calculus II',
                coreIdea: 'Parametric Equations and Polar Coordinates'
            },
            72: { // Area and arc length in polar coordinates -> ParamPol3
                topicCode: 'ParamPol3',
                topicName: 'Area and arc length in polar coordinates',
                course: 'Calculus II',
                coreIdea: 'Parametric Equations and Polar Coordinates'
            },
            73: { // Conic sections -> ParamPol4
                topicCode: 'ParamPol4',
                topicName: 'Conic sections',
                course: 'Calculus II',
                coreIdea: 'Parametric Equations and Polar Coordinates'
            }
        };
        return specialMappings[numberId];
    }

    function renderCalculusTree(hierarchy) {
        const container = d3.select('#calculus-tree');
        if (container.empty()) {
            return;
        }
        
        container.html('');

        const courses = Array.from(hierarchy.values());

        courses.forEach((courseEntry) => {
            const courseGroup = container.append('div').attr('class', 'course-group');
            const courseClass = courseEntry.course.toLowerCase().replace(/\s+/g, '-');
            const courseHeader = courseGroup.append('div')
                .attr('class', `tree-course ${courseClass}`);

            const courseHeaderLeft = courseHeader.append('div').attr('class', 'tree-course-left');
            const toggleIcon = courseHeaderLeft.append('span').attr('class', 'tree-toggle-icon').text('▸');
            courseHeaderLeft.append('span').text(courseEntry.course);

            const checkbox = courseHeader.append('input')
                .attr('type', 'checkbox')
                .attr('class', 'course-checkbox')
                .property('checked', state.selectedCourses.has(courseEntry.course));

            const coreContainer = courseGroup.append('div').attr('class', 'tree-children');

            courseHeaderLeft.on('click', () => {
                const isOpen = coreContainer.classed('open');
                coreContainer.classed('open', !isOpen);
                toggleIcon.text(isOpen ? '▸' : '▾');
            });

            const isCourseSelected = state.selectedCourses.has(courseEntry.course);

            checkbox.on('change', (event) => {
                if (event.target.checked) {
                    state.selectedCourses.add(courseEntry.course);
                } else {
                    state.selectedCourses.delete(courseEntry.course);
                }
                updateCourseSummary();
                applyCourseFilter();
                recomputeCalcConnections();
                updateNodeStyling();
                updateCourseChildrenState(coreContainer, courseEntry.course);
            });

            const sortedCoreIdeas = Array.from(courseEntry.coreIdeas.entries());

            sortedCoreIdeas.forEach(([coreIdea, topics]) => {
                const coreGroup = coreContainer.append('div').attr('class', 'core-group');
                const coreHeader = coreGroup.append('div')
                    .attr('class', `tree-core ${!isCourseSelected ? 'disabled' : ''}`);

                const coreLeft = coreHeader.append('div').attr('class', 'tree-core-left');
                const coreToggle = coreLeft.append('span').attr('class', 'tree-toggle-icon').text('▸');
                coreLeft.append('span').text(coreIdea);
                const coreSummary = coreHeader.append('span').attr('class', 'core-summary').text(`${topics.length} topics`);

                const topicContainer = coreGroup.append('div').attr('class', 'tree-children');

                coreLeft.on('click', () => {
                    if (!state.selectedCourses.has(courseEntry.course)) return;
                    const isOpen = topicContainer.classed('open');
                    topicContainer.classed('open', !isOpen);
                    coreToggle.text(isOpen ? '▸' : '▾');
                });

                topics.forEach((topicMeta) => {
                    const topicButton = topicContainer.append('button')
                        .attr('type', 'button')
                        .attr('class', `tree-topic ${!isCourseSelected ? 'disabled' : ''}`)
                        .attr('data-topic-code', topicMeta.topicCode)
                        .property('disabled', !isCourseSelected)
                        .on('click', () => {
                            if (!state.selectedCourses.has(courseEntry.course)) return;
                            state.activeTopicCode = topicMeta.topicCode;
                            updateActiveSidebarTopic(topicMeta.topicCode);
                            const nodeId = state.nodeIdByTopicCode.get(topicMeta.topicCode);
                            if (nodeId) {
                                const nodeData = state.nodeById.get(nodeId);
                                if (nodeData) {
                                    selectCalculusNode(nodeData, { fromSidebar: true });
                                }
                            }
                        });

                    const labelWrapper = topicButton.append('div').attr('class', 'topic-label');
                    labelWrapper.append('span').text(`${topicMeta.topicCode}. ${topicMeta.topicName}`);
                    labelWrapper.append('small').text(coreIdea);
                });
            });
        });
    }

    function updateCourseChildrenState(coreContainer, courseName) {
        const isSelected = state.selectedCourses.has(courseName);
        coreContainer.selectAll('.tree-core')
            .classed('disabled', !isSelected);
        coreContainer.selectAll('.tree-topic')
            .classed('disabled', !isSelected)
            .property('disabled', !isSelected);
    }

    function parseCSTopicsCsv(rawText) {
        if (!rawText) {
            return [];
        }

        const strippedLines = rawText.split(/\r?\n/).filter((line, index) => {
            if (index === 0 && /^table/i.test(line.trim())) {
                return false;
            }
            return line.trim().length > 0;
        });

        const parsedRows = d3.csvParseRows(strippedLines.join('\n'));
        const headerIndex = parsedRows.findIndex((row) => row[0] === 'Course');
        const dataRows = headerIndex >= 0 ? parsedRows.slice(headerIndex + 1) : parsedRows;

        const result = [];
        dataRows.forEach((row) => {
            const [course, topicName] = row;
            if (course && topicName) {
                result.push({
                    course: course.trim(),
                    topicName: topicName.trim()
                });
            }
        });

        return result;
    }

    function renderCSTopicTree(nodes, csTopicsList) {
        const container = d3.select('#cs-topic-tree');
        if (container.empty()) {
            return;
        }
        
        container.html('');

        // Build a map of topics that have connections (from nodes)
        const topicsWithConnections = new Map();
        nodes.forEach((node) => {
            const rationales = node.rationales || {};
            Object.entries(rationales).forEach(([category, items]) => {
                if (!topicsWithConnections.has(category)) {
                    topicsWithConnections.set(category, new Set());
                }
                items.forEach((item) => {
                    const topicName = (item.cs_topic || '').trim();
                    if (topicName) {
                        topicsWithConnections.get(category).add(topicName);
                    }
                });
            });
        });

        // Group CS topics by course/category
        const topicsByCategory = new Map();
        if (csTopicsList && csTopicsList.length > 0) {
            csTopicsList.forEach((item) => {
                const category = item.course;
                if (!topicsByCategory.has(category)) {
                    topicsByCategory.set(category, []);
                }
                topicsByCategory.get(category).push(item.topicName);
            });
        } else {
            // Fallback to old behavior if no CS topics list provided
            topicsWithConnections.forEach((topicSet, category) => {
                topicsByCategory.set(category, Array.from(topicSet));
            });
        }

        // Sort categories
        const sortedCategories = Array.from(topicsByCategory.entries()).sort((a, b) => a[0].localeCompare(b[0]));

        sortedCategories.forEach(([category, topicNames]) => {
            const categoryGroup = container.append('div').attr('class', 'cs-category-group');
            
            const categoryButton = categoryGroup.append('div').attr('class', 'cs-category-button');
            const categoryLeft = categoryButton.append('div').attr('class', 'cs-category-left');
            const toggleIcon = categoryLeft.append('span').attr('class', 'tree-toggle-icon').text('▸');
            categoryLeft.append('span').attr('class', 'cs-category-name').text(category);

            const selectAllCheckbox = categoryButton.append('input')
                .attr('type', 'checkbox')
                .attr('class', 'cs-select-all-checkbox')
                .attr('data-category', category)
                .property('checked', false);

            const topicsContainer = categoryGroup.append('div').attr('class', 'tree-children');

            categoryLeft.on('click', (event) => {
                event.stopPropagation();
                const isOpen = topicsContainer.classed('open');
                topicsContainer.classed('open', !isOpen);
                toggleIcon.text(isOpen ? '▸' : '▾');
            });

            // Check which topics have connections
            const topicsWithConnectionsSet = topicsWithConnections.get(category) || new Set();

            topicNames.forEach((topicName) => {
                const hasConnection = topicsWithConnectionsSet.has(topicName);
                const topicButton = topicsContainer.append('button')
                    .attr('type', 'button')
                    .attr('class', `cs-topic-button ${!hasConnection ? 'cs-topic-no-connection' : ''}`)
                    .attr('data-category', category)
                    .attr('data-topic', topicName)
                    .text(topicName)
                    .on('click', (event) => {
                        event.stopPropagation();
                        if (hasConnection) {
                            toggleCSTopicSelection(category, topicName, topicButton);
                        }
                    });

                if (!hasConnection) {
                    topicButton.property('disabled', true);
                }
            });

            // Handle select all checkbox
            selectAllCheckbox.on('change', function(event) {
                event.stopPropagation();
                const isChecked = event.target.checked;
                const topicButtons = topicsContainer.selectAll('.cs-topic-button');
                
                topicButtons.each(function() {
                    const btn = d3.select(this);
                    if (btn.property('disabled')) return; // Skip disabled topics
                    const topicName = btn.attr('data-topic');
                    const isCurrentlyActive = btn.classed('active');
                    
                    if (isChecked && !isCurrentlyActive) {
                        toggleCSTopicSelection(category, topicName, btn);
                    } else if (!isChecked && isCurrentlyActive) {
                        toggleCSTopicSelection(category, topicName, btn);
                    }
                });
                
                const enabledTopics = topicsContainer.selectAll('.cs-topic-button:not([disabled])').size();
                updateSelectAllCheckbox(category, enabledTopics);
            });
        });
    }

    function toggleCSTopicSelection(category, topicName, buttonSelection) {
        let topicsSet = state.selectedCSTopics.get(category);
        if (!topicsSet) {
            topicsSet = new Set();
            state.selectedCSTopics.set(category, topicsSet);
        }

        if (topicsSet.has(topicName)) {
            topicsSet.delete(topicName);
            buttonSelection.classed('active', false);
            if (topicsSet.size === 0) {
                state.selectedCSTopics.delete(category);
            }
        } else {
            topicsSet.add(topicName);
            buttonSelection.classed('active', true);
        }

        // Update select all checkbox state
        const totalTopics = d3.selectAll(`.cs-topic-button[data-category="${category}"]`).size();
        updateSelectAllCheckbox(category, totalTopics);

        updateCsSelectionSummary();
        recomputeCalcConnections();
        updateCSHighlights();
        updateNodeStyling();
        if (state.selectedNodeId) {
            const selectedNode = state.nodeById.get(state.selectedNodeId);
            if (selectedNode) {
                showRationale(selectedNode);
            }
        }
    }

    function clearSelectedCSTopics() {
        state.selectedCSTopics.clear();
        d3.selectAll('.cs-topic-button').classed('active', false);
        d3.selectAll('.cs-select-all-checkbox').property('checked', false);
        updateCsSelectionSummary();
        recomputeCalcConnections();
    }

    function updateSelectAllCheckbox(category, totalTopics) {
        const selectedCount = state.selectedCSTopics.get(category)?.size || 0;
        const checkbox = d3.select(`.cs-select-all-checkbox[data-category="${category}"]`);
        
        if (selectedCount === 0) {
            checkbox.property('checked', false);
            checkbox.property('indeterminate', false);
        } else if (selectedCount === totalTopics) {
            checkbox.property('checked', true);
            checkbox.property('indeterminate', false);
        } else {
            checkbox.property('checked', false);
            checkbox.property('indeterminate', true);
        }
    }

    function updateCSHighlights() {
        state.csHighlightLevels.clear();

        state.selectedCSTopics.forEach((topicsSet, category) => {
            topicsSet.forEach((topic) => {
                state.nodes.forEach((node) => {
                    const level = getConnectionLevel(node, category, topic);
                    if (level > 0) {
                        const existing = state.csHighlightLevels.get(node.id) || 0;
                        state.csHighlightLevels.set(node.id, Math.max(existing, level));
                    }
                });
            });
        });
    }

    function getConnectionLevel(node, category, topic) {
        if (!node.rationales || !node.rationales[category]) {
            return 0;
        }
        const entry = node.rationales[category].find((item) => (item.cs_topic || '').trim() === topic);
        if (!entry) {
            return 0;
        }
        return entry.connection_level || entry.connectionLevel || entry.connectionStrength || 1;
    }

    function updateCourseSummary() {
        if (courseSummary.empty()) {
            return;
        }
        if (state.selectedCourses.size === state.allCourses.length) {
            courseSummary.text('All courses selected');
        } else if (state.selectedCourses.size === 0) {
            courseSummary.text('No courses selected');
        } else {
            courseSummary.text(`Selected: ${Array.from(state.selectedCourses).join(', ')}`);
        }
    }

    function updateCsSelectionSummary() {
        if (csSelectionSummary.empty()) {
            return;
        }

        const entries = [];
        state.selectedCSTopics.forEach((topicsSet, category) => {
            topicsSet.forEach((topic) => {
                entries.push(`${category} · ${topic}`);
            });
        });

        if (entries.length === 0) {
            csSelectionSummary.text('No CS topics selected. Pick one or more topics on the left.');
            return;
        }

        const total = entries.length;
        const preview = entries.slice(0, 4);
        let summary = `CS topics selected (${total}): ${preview.join(', ')}`;
        if (total > preview.length) {
            summary += `, +${total - preview.length} more`;
        }
        csSelectionSummary.text(summary);
    }

    function recomputeCalcConnections() {
        state.calcConnectionsByNodeId.clear();

        const selectedFilters = getSelectedCSTopicFilters();
        if (selectedFilters.length === 0) {
            updateCalcListFiltersUI(0);
            renderCalcTopicList();
            return;
        }

        let maxConnections = 0;

        state.nodes.forEach((node) => {
            // 先根据 Calculus Courses 过滤：只对当前可见课程的节点计算连接
            if (node.isCourseVisible === false) {
                return;
            }
            const rationales = node.rationales || {};
            let totalConnections = 0;
            const filterSummaries = [];

            selectedFilters.forEach(({ category, topic }) => {
                const items = (rationales[category] || []).filter(
                    (entry) => (entry.cs_topic || '').trim() === topic
                );
                if (items.length > 0) {
                    totalConnections += items.length;
                    filterSummaries.push({
                        category,
                        topic,
                        count: items.length
                    });
                }
            });

            if (totalConnections > 0) {
                state.calcConnectionsByNodeId.set(node.id, {
                    node,
                    totalConnections,
                    filterSummaries
                });
                if (totalConnections > maxConnections) {
                    maxConnections = totalConnections;
                }
            }
        });

        updateCalcListFiltersUI(maxConnections);
        renderCalcTopicList();
    }

    function renderCalcTopicList() {
        if (calcListContainer.empty()) {
            return;
        }

        const hasCsSelection = state.selectedCSTopics.size > 0;

        if (!hasCsSelection) {
            calcListContainer.html('');
            if (!calcListEmpty.empty()) {
                calcListEmpty
                    .classed('hidden', false)
                    .select('p')
                    .text('Choose a CS course or topic on the left to see the list of connected calculus ideas here.');
            }
            updateActiveCalcListTopic(null);
            return;
        }

        const connections = Array.from(state.calcConnectionsByNodeId.values());

        if (connections.length === 0) {
            calcListContainer.html('');
            if (!calcListEmpty.empty()) {
                calcListEmpty
                    .classed('hidden', false)
                    .select('p')
                    .text('No calculus topics are currently connected to the selected CS topics.');
            }
            updateActiveCalcListTopic(null);
            return;
        }

        if (!calcListEmpty.empty()) {
            calcListEmpty.classed('hidden', true);
        }

        // Determine max connections for heat map scaling
        const maxConnections = connections.reduce(
            (max, entry) => Math.max(max, entry.totalConnections),
            1
        );

        // Clamp threshold
        const clampedThreshold = Math.max(
            1,
            Math.min(state.connectionThreshold || 1, maxConnections)
        );
        state.connectionThreshold = clampedThreshold;

        const filtered = connections.filter(
            (entry) => entry.totalConnections >= clampedThreshold
        );

        let sorted = filtered.slice();
        if (state.calcSortMode === 'alpha') {
            sorted.sort((a, b) =>
                (a.node.topicName || a.node.label || '').localeCompare(
                    b.node.topicName || b.node.label || ''
                )
            );
        } else if (state.calcSortMode === 'connections') {
            sorted.sort((a, b) => b.totalConnections - a.totalConnections);
        } else {
            // Default: course -> core idea -> topic code (with numeric sorting)
            // Helper function to extract prefix and number from topic code (e.g., "Lim1" -> ["Lim", 1])
            const parseTopicCode = (code) => {
                if (!code) return { prefix: '', num: 0 };
                const match = String(code).match(/^([A-Za-z]+)(\d+)$/);
                if (match) {
                    return { prefix: match[1], num: parseInt(match[2], 10) };
                }
                return { prefix: code, num: 0 };
            };
            
            sorted.sort((a, b) => {
                const courseA = (a.node.course || a.node.calc_level || '').localeCompare(
                    b.node.course || b.node.calc_level || ''
                );
                if (courseA !== 0) return courseA;
                const coreA = (a.node.coreIdea || '').localeCompare(b.node.coreIdea || '');
                if (coreA !== 0) return coreA;
                
                // Sort by topic code with numeric ordering
                const codeA = parseTopicCode(a.node.topicCode);
                const codeB = parseTopicCode(b.node.topicCode);
                const prefixCompare = codeA.prefix.localeCompare(codeB.prefix);
                if (prefixCompare !== 0) return prefixCompare;
                return codeA.num - codeB.num;
            });
        }

        state.expandedCalcPrereqIds.clear();
        calcListContainer.html('');

        const rowSelection = calcListContainer
            .selectAll('.calc-topic-row')
            .data(sorted, (d) => d.node.id);

        const rowEnter = rowSelection
            .enter()
            .append('div')
            .attr('class', 'calc-topic-row')
            .attr('data-node-id', (d) => d.node.id);

        rowEnter.each(function (entry) {
            const row = d3.select(this);
            const node = entry.node;

            const coreIdea =
                node.coreIdea || state.topicMetaByCode.get(node.topicCode)?.coreIdea;
            const categoryKey = getCoreIdeaCategory(coreIdea);
            const courseKey = (node.course || node.calc_level || '')
                .replace(/\s+/g, '-')
                .toLowerCase();

            const pill = row
                .append('button')
                .attr('type', 'button')
                .attr(
                    'class',
                    `calc-pill calc-pill--${categoryKey}${
                        courseKey === 'calculus-ii' ? ' calc-pill--calculus-ii' : ''
                    }`
                )
                .on('click', (event) => {
                    event.stopPropagation();
                    selectCalculusNode(node, { fromSidebar: true });
                });

            const textWrapper = pill.append('div').style('flex', '1 1 auto');
            textWrapper
                .append('span')
                .attr('class', 'calc-pill-label')
                .text(node.topicName || node.label || '');
            textWrapper
                .append('div')
                .attr('class', 'calc-pill-meta')
                .text(() => {
                    const course = node.course || node.calc_level || '';
                    const idea = coreIdea || '';
                    const parts = [];
                    if (course) parts.push(course);
                    if (idea) parts.push(idea);
                    return parts.join(' · ');
                });

            pill
                .append('span')
                .attr('class', 'calc-pill-meta')
                .text(`×${entry.totalConnections}`);

            const meta = state.topicMetaByCode.get(node.topicCode);
            const textbooks = meta && meta.textbooks;
            const hasAnyRef =
                textbooks &&
                TEXTBOOK_DISPLAY_ORDER.some((k) => !isTextbookCellEmpty(textbooks[k]));
            const tooltipHtml = hasAnyRef
                ? buildTextbookReferenceTooltipHtml(textbooks) || CALC_BOOK_NO_MAPPING_HTML
                : CALC_BOOK_NO_MAPPING_HTML;

            const bookBtn = row
                .append('button')
                .attr('type', 'button')
                .classed('calc-topic-textbook-btn', true)
                .classed('calc-topic-textbook-btn--calculus-ii', courseKey === 'calculus-ii')
                .classed('calc-topic-textbook-btn--empty', !hasAnyRef)
                .attr('aria-label', hasAnyRef ? 'Textbook references' : 'No textbook mapping')
                .on('click', (event) => {
                    event.stopPropagation();
                })
                .html(CALC_BOOK_ICON_SVG);

            bookBtn
                .on('mouseenter', function () {
                    cancelHideCalcBookTooltip();
                    showCalcBookTooltip(tooltipHtml, this);
                })
                .on('mouseleave', scheduleHideCalcBookTooltip)
                .on('focus', function () {
                    cancelHideCalcBookTooltip();
                    showCalcBookTooltip(tooltipHtml, this);
                })
                .on('blur', scheduleHideCalcBookTooltip);
        });

        rowSelection.exit().remove();

        // Highlight the currently selected calculus topic, if any
        updateActiveCalcListTopic(state.selectedNodeId);

        // Apply heat levels based on connection counts
        calcListContainer.selectAll('.calc-topic-row').each(function (entry) {
            const pill = d3.select(this).select('.calc-pill');
            const ratio = maxConnections > 1 ? entry.totalConnections / maxConnections : 1;
            let heatLevel = 1;
            if (ratio >= 0.66) {
                heatLevel = 3;
            } else if (ratio >= 0.33) {
                heatLevel = 2;
            }
            pill
                .classed('calc-pill--heat-1', heatLevel === 1)
                .classed('calc-pill--heat-2', heatLevel === 2)
                .classed('calc-pill--heat-3', heatLevel === 3);
        });
    }

    function getCoreIdeaCategory(coreIdea) {
        const value = (coreIdea || '').toLowerCase();
        if (!value) {
            return 'other';
        }
        if (value.includes('limit')) {
            return 'limits';
        }
        if (value.includes('deriv')) {
            return 'derivatives';
        }
        if (value.includes('sequence') || value.includes('series')) {
            return 'sequences';
        }
        if (value.includes('integral') || value.includes('area')) {
            return 'integrals';
        }
        return 'other';
    }

    function updateCalcListFiltersUI(maxConnections) {
        if (connectionThresholdInput.empty() || connectionThresholdValue.empty()) {
            return;
        }

        if (maxConnections <= 1) {
            state.connectionThreshold = 1;
            connectionThresholdInput
                .property('disabled', true)
                .attr('min', 1)
                .attr('max', 1)
                .property('value', 1);
            connectionThresholdValue.text('1');
        } else {
            const upper = Math.max(1, maxConnections);
            connectionThresholdInput
                .property('disabled', false)
                .attr('min', 1)
                .attr('max', upper);
            if (!state.connectionThreshold || state.connectionThreshold > upper) {
                state.connectionThreshold = 1;
            }
            connectionThresholdInput.property('value', state.connectionThreshold);
            connectionThresholdValue.text(String(state.connectionThreshold));
        }
    }

    function updateActiveCalcListTopic(nodeId) {
        if (calcListContainer.empty()) {
            return;
        }
        calcListContainer.selectAll('.calc-topic-row').classed('active', function () {
            const currentId = d3.select(this).attr('data-node-id');
            return Boolean(nodeId) && currentId === String(nodeId);
        });
    }

    function applyCourseFilter() {
        state.nodes.forEach((node) => {
            const courseName = node.course || node.calc_level;
            node.isCourseVisible = state.selectedCourses.size === 0 || state.selectedCourses.has(courseName);
        });
    }

    function updateNodeStyling() {
        if (!state.nodeSelection) {
            return;
        }

        const prereqOutsideHighlight = computePrereqOutsideHighlightIds();

        state.nodeSelection
            .classed('selected', (d) => d.id === state.selectedNodeId)
            .classed('incoming', (d) => state.incomingNodeIds.has(d.id))
            .classed('outgoing', (d) => state.outgoingNodeIds.has(d.id) && d.id !== state.selectedNodeId)
            .classed('cs-highlight', (d) => state.csHighlightLevels.has(d.id))
            .classed('prereq-only', (d) => prereqOutsideHighlight.has(d.id))
            .classed('course-hidden', (d) => !d.isCourseVisible)
            .classed('faded', (d) => shouldFadeNode(d, prereqOutsideHighlight));

        state.circleSelection.attr('r', (d) => computeNodeRadius(d));

        if (state.linkSelection) {
            state.linkSelection
                .classed('incoming-link', (link) => link.target.id === state.selectedNodeId)
                .classed('outgoing-link', (link) => link.source.id === state.selectedNodeId)
                .classed('course-hidden', (link) => !isCourseVisibleRef(link.source) || !isCourseVisibleRef(link.target))
                .classed('faded', (link) => shouldFadeLink(link));
        }

        if (state.simulation) {
            state.simulation.force('collision').radius((d) => computeNodeRadius(d) + 22);
        }
    }

    function shouldFadeNode(node, prereqOutsideHighlight) {
        if (!node.isCourseVisible) {
            return false;
        }
        const hasSelectedNode = Boolean(state.selectedNodeId);
        const hasHighlight = state.csHighlightLevels.size > 0;
        const isSelected = node.id === state.selectedNodeId;
        const isIncoming = state.incomingNodeIds.has(node.id);
        const isOutgoing = state.outgoingNodeIds.has(node.id);
        const isDisciplineHighlighted = state.csHighlightLevels.has(node.id);
        const isPrereqContext = prereqOutsideHighlight && prereqOutsideHighlight.has(node.id);

        const fadeForCalc = hasSelectedNode && !isSelected && !isIncoming && !isOutgoing && !isDisciplineHighlighted;
        const fadeForCS = hasHighlight && !isDisciplineHighlighted && !isSelected && !isIncoming && !isPrereqContext;
        return (fadeForCalc || fadeForCS) && !isOutgoing;
    }

    function shouldFadeLink(link) {
        if (!isCourseVisibleRef(link.source) || !isCourseVisibleRef(link.target)) {
            return false;
        }
        if (state.selectedNodeId) {
            const sourceNode = resolveNodeRef(link.source);
            const targetNode = resolveNodeRef(link.target);
            if (!sourceNode || !targetNode) {
                return false;
            }
            return sourceNode.id !== state.selectedNodeId && targetNode.id !== state.selectedNodeId;
        }
        return false;
    }

    function computeNodeRadius(node) {
        const baseRadius = 15;
        let radius = baseRadius;

        if (state.selectedCourses.size === state.allCourses.length && state.allCourses.length > 0) {
            const scaleMin = 14;
            const scaleMax = 28;
            const degreeRatio = state.maxDegree > 0 ? node.degree / state.maxDegree : 0;
            radius = scaleMin + degreeRatio * (scaleMax - scaleMin);
        }

        const csHighlightLevel = state.csHighlightLevels.get(node.id) || 0;
        if (csHighlightLevel >= 2) {
            radius += 4;
        } else if (csHighlightLevel === 1) {
            radius += 2;
        }

        if (node.id === state.selectedNodeId) {
            radius += 1.5;
        }

        return radius;
    }

    function selectCalculusNode(nodeData, options = {}) {
        state.selectedNodeId = nodeData.id;
        state.incomingNodeIds = getConnectedNodes(nodeData.id, 'incoming');
        state.outgoingNodeIds = getConnectedNodes(nodeData.id, 'outgoing');
        state.activeTopicCode = nodeData.topicCode || null;

        updateActiveSidebarTopic(state.activeTopicCode);
        updateActiveCalcListTopic(nodeData.id);
        updateNodeStyling();
        showRationale(nodeData);

        const focusNodes = [nodeData.id, ...Array.from(state.incomingNodeIds)];
        focusOnNodes(focusNodes, { animate: !options.fromSidebar });
    }

    function resetCalculusSelection({ shouldRefit = false } = {}) {
        state.selectedNodeId = null;
        state.incomingNodeIds.clear();
        state.outgoingNodeIds.clear();
        state.activeTopicCode = null;
        updateActiveSidebarTopic(null);
        updateActiveCalcListTopic(null);
        updateNodeStyling();
        rationaleDisplay.classed('hidden', true);
        emptyState.classed('hidden', false);

        if (shouldRefit) {
            fitGraphToView({ animate: true });
        }
    }

    function getConnectedNodes(nodeId, direction) {
        const result = new Set();
        state.edges.forEach((edge) => {
            const sourceNode = resolveNodeRef(edge.source);
            const targetNode = resolveNodeRef(edge.target);
            if (!sourceNode || !targetNode) {
                return;
            }

            if (direction === 'incoming' && targetNode.id === nodeId) {
                result.add(sourceNode.id);
            }
            if (direction === 'outgoing' && sourceNode.id === nodeId) {
                result.add(targetNode.id);
            }
        });
        return result;
    }

    function resolveNodeRef(ref) {
        if (ref && typeof ref === 'object') {
            return ref;
        }
        return state.nodeById.get(ref);
    }

    function computePrereqOutsideHighlightIds() {
        const result = new Set();
        if (!state.csHighlightLevels || state.csHighlightLevels.size === 0) {
            return result;
        }
        state.edges.forEach((edge) => {
            const sourceNode = resolveNodeRef(edge.source);
            const targetNode = resolveNodeRef(edge.target);
            if (!sourceNode || !targetNode) {
                return;
            }
            if (state.csHighlightLevels.has(targetNode.id) && !state.csHighlightLevels.has(sourceNode.id)) {
                result.add(sourceNode.id);
            }
        });
        return result;
    }

    function getDirectHighlightSuccessors(nodeId) {
        const list = [];
        const seen = new Set();
        if (!state.csHighlightLevels || state.csHighlightLevels.size === 0) {
            return list;
        }
        state.edges.forEach((edge) => {
            const sourceNode = resolveNodeRef(edge.source);
            const targetNode = resolveNodeRef(edge.target);
            if (!sourceNode || !targetNode) {
                return;
            }
            if (sourceNode.id === nodeId && state.csHighlightLevels.has(targetNode.id) && !seen.has(targetNode.id)) {
                seen.add(targetNode.id);
                list.push(targetNode);
            }
        });
        list.sort((a, b) => String(a.topicCode || a.id).localeCompare(String(b.topicCode || b.id), undefined, { numeric: true }));
        return list;
    }

    function formatPrecursorSuccessorLabel(node) {
        const code = node.topicCode != null ? String(node.topicCode) : (node.number_id != null ? String(node.number_id) : String(node.id));
        const name = (node.topicName || node.label || '').trim();
        return name ? `${code} · ${name}` : code;
    }

    function isCourseVisibleRef(ref) {
        const node = resolveNodeRef(ref);
        return node ? node.isCourseVisible : true;
    }

    function showRationale(nodeData) {
        if (!nodeData) {
            rationaleDisplay.classed('hidden', true);
            emptyState.classed('hidden', false);
            return;
        }
        
        rationaleTitle.text(`${nodeData.topicCode || nodeData.number_id || ''} ${nodeData.topicName || nodeData.label}`.trim());
        rationaleLevel.text(`${nodeData.course || nodeData.calc_level || ''}${nodeData.coreIdea ? ` · ${nodeData.coreIdea}` : ''}`);

        const selectedFilters = getSelectedCSTopicFilters();
        const rationales = nodeData.rationales || {};
        rationaleContent.html('');

        let hasMatchingRationales = false;

        if (selectedFilters.length === 0) {
            Object.entries(rationales).forEach(([category, items]) => {
                appendRationaleCategory(category, items);
            });
            if (Object.keys(rationales).length > 0) {
                hasMatchingRationales = true;
            }
        } else {
            let added = false;
            selectedFilters.forEach(({ category, topic }) => {
                const items = (rationales[category] || []).filter((entry) => (entry.cs_topic || '').trim() === topic);
                if (items.length > 0) {
                    appendRationaleCategory(category, items, topic);
                    added = true;
                }
            });

            if (!added) {
                if (!state.csHighlightLevels.has(nodeData.id)) {
                    const successors = getDirectHighlightSuccessors(nodeData.id);
                    if (successors.length) {
                        rationaleContent.append('p')
                            .attr('class', 'precursor-message')
                            .text('This concept is a relevant precursor to:');
                        const ul = rationaleContent.append('ul').attr('class', 'precursor-successor-list');
                        successors.forEach((n) => {
                            ul.append('li').text(formatPrecursorSuccessorLabel(n));
                        });
                    } else {
                        rationaleContent.append('p')
                            .attr('class', 'no-rationale-message')
                            .text('This topic is not in the current connected set for your CS selection, and it has no direct link forward into those topics on this map.');
                    }
                } else {
                    rationaleContent.append('p')
                        .attr('class', 'no-rationale-message')
                        .text('No rationales match the currently selected CS topics.');
                }
            }
            hasMatchingRationales = added;
        }

        updateCalcPillRationaleState(nodeData.id, hasMatchingRationales, selectedFilters.length > 0);

        // Render LaTeX after all content is added
        if (window.renderMathInElement && rationaleContent.node()) {
            window.renderMathInElement(rationaleContent.node(), {
                delimiters: [
                    {left: '$$', right: '$$', display: true},
                    {left: '\\[', right: '\\]', display: true},
                    {left: '$', right: '$', display: false},
                    {left: '\\(', right: '\\)', display: false}
                ],
                throwOnError: false,
                preProcess: (math) => math // Ensure math is processed correctly
            });
        }

        rationaleDisplay.classed('hidden', false);
        emptyState.classed('hidden', true);
    }

    function updateCalcPillRationaleState(nodeId, hasMatch, hasActiveFilters) {
        if (!calcListContainer || calcListContainer.empty()) {
            return;
        }
        const pill = calcListContainer
            .select(`.calc-topic-row[data-node-id="${nodeId}"] .calc-pill`);
        if (pill.empty()) {
            return;
        }
        // 当有 CS 过滤但当前节点没有任何匹配的 rationale 时，将 pill 置为灰色
        const shouldGreyOut = hasActiveFilters && !hasMatch;
        pill.classed('calc-pill--no-rationale', shouldGreyOut);
    }

    function appendRationaleCategory(category, items, topicFilter) {
        const header = rationaleContent.append('h5').text(category);
        if (topicFilter) {
            header.append('span').text(` · ${topicFilter}`);
        }
        items.forEach((item) => {
            const block = rationaleContent.append('div').attr('class', 'rationale-item');
            const rationaleText = item.rationale || '';
            block.html(`<strong>${item.cs_topic || ''}:</strong> ${rationaleText}`);
        });
    }

    function getSelectedCSTopicFilters() {
        const filters = [];
        state.selectedCSTopics.forEach((topicsSet, category) => {
            topicsSet.forEach((topic) => {
                filters.push({ category, topic });
            });
        });
        return filters;
    }

    function updateActiveSidebarTopic(topicCode) {
        d3.selectAll('.tree-topic').classed('active', function () {
            const code = d3.select(this).attr('data-topic-code');
            return topicCode && code === topicCode;
        });
    }

    function focusOnNodes(nodeIds, { animate = true } = {}) {
        if (!nodeIds || nodeIds.length === 0) {
            return;
        }
        const nodesToFocus = state.nodes.filter((node) => nodeIds.includes(node.id));
        if (nodesToFocus.length === 0) {
            return;
        }

        const minX = d3.min(nodesToFocus, (node) => node.x);
        const maxX = d3.max(nodesToFocus, (node) => node.x);
        const minY = d3.min(nodesToFocus, (node) => node.y);
        const maxY = d3.max(nodesToFocus, (node) => node.y);

        const padding = 120;
        const boundsWidth = Math.max(maxX - minX, 1);
        const boundsHeight = Math.max(maxY - minY, 1);

        const scale = Math.min(state.width / (boundsWidth + padding), state.height / (boundsHeight + padding));
        const clampedScale = Math.max(Math.min(scale, 3.2), 0.6);

        const translateX = state.width / 2 - ((minX + maxX) / 2) * clampedScale;
        const translateY = state.height / 2 - ((minY + maxY) / 2) * clampedScale;

        const transform = d3.zoomIdentity.translate(translateX, translateY).scale(clampedScale);

        if (animate) {
            svg.transition().duration(650).call(state.zoom.transform, transform);
        } else {
            svg.call(state.zoom.transform, transform);
        }
    }

    function fitGraphToView({ animate = false } = {}) {
        if (!state.nodes || state.nodes.length === 0) {
            return;
        }
        const minX = d3.min(state.nodes, (node) => node.x);
        const maxX = d3.max(state.nodes, (node) => node.x);
        const minY = d3.min(state.nodes, (node) => node.y);
        const maxY = d3.max(state.nodes, (node) => node.y);

        const padding = 200;
        const boundsWidth = Math.max(maxX - minX, 1);
        const boundsHeight = Math.max(maxY - minY, 1);

        const scale = Math.min(state.width / (boundsWidth + padding), state.height / (boundsHeight + padding));
        const clampedScale = Math.max(Math.min(scale, 2.5), 0.5);

        const translateX = state.width / 2 - ((minX + maxX) / 2) * clampedScale;
        const translateY = state.height / 2 - ((minY + maxY) / 2) * clampedScale;

        const transform = d3.zoomIdentity.translate(translateX, translateY).scale(clampedScale);

        if (animate) {
            svg.transition().duration(750).call(state.zoom.transform, transform);
        } else {
            svg.call(state.zoom.transform, transform);
        }
    }

    function handleResize() {
        applyChartDimensions();
        if (!state.simulation) {
            return;
        }
        state.simulation.force('center', d3.forceCenter(state.width / 2, state.height / 2));
        state.simulation.alpha(0.2).restart();
        if (state.width >= 8 && state.height >= 8) {
            fitGraphToView({ animate: state.initialFitDone });
            state.initialFitDone = true;
        }
    }

    if (typeof ResizeObserver !== 'undefined') {
        let roTimer = null;
        const ro = new ResizeObserver(() => {
            if (!state.simulation) {
                return;
            }
            window.clearTimeout(roTimer);
            roTimer = window.setTimeout(handleResize, 48);
        });
        const cNode = container.node();
        const pNode = chartPanel.node();
        if (cNode) {
            ro.observe(cNode);
        }
        if (pNode) {
            ro.observe(pNode);
        }
    }
});