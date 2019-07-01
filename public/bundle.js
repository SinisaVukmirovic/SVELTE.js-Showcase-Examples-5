
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? undefined : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.data !== data)
            text.data = data;
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }

    const dirty_components = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.shift()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            while (render_callbacks.length) {
                const callback = render_callbacks.pop();
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_render);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_render.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.callbacks.push(() => {
                outroing.delete(block);
                if (callback) {
                    block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_render } = component.$$;
        fragment.m(target, anchor);
        // onMount happens after the initial afterUpdate. Because
        // afterUpdate callbacks happen in reverse order (inner first)
        // we schedule onMount callbacks before afterUpdate callbacks
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_render.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal$$1, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal: not_equal$$1,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_render: [],
            after_render: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, value) => {
                if ($$.ctx && not_equal$$1($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_render);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src\Header.svelte generated by Svelte v3.6.1 */

    const file = "src\\Header.svelte";

    function create_fragment(ctx) {
    	var nav, img, t, div;

    	return {
    		c: function create() {
    			nav = element("nav");
    			img = element("img");
    			t = space();
    			div = element("div");
    			div.textContent = "Showcasing SVELTE.js by Examples";
    			attr(img, "src", "./img/svelte-logo-horizontal.svg");
    			attr(img, "alt", "Svelte Logo");
    			attr(img, "class", "svelte-1t1fn3u");
    			add_location(img, file, 25, 4, 517);
    			attr(div, "class", "svelte-1t1fn3u");
    			add_location(div, file, 26, 4, 585);
    			attr(nav, "class", "svelte-1t1fn3u");
    			add_location(nav, file, 24, 0, 506);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, nav, anchor);
    			append(nav, img);
    			append(nav, t);
    			append(nav, div);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(nav);
    			}
    		}
    	};
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment, safe_not_equal, []);
    	}
    }

    /* src\Counter.svelte generated by Svelte v3.6.1 */

    const file$1 = "src\\Counter.svelte";

    function create_fragment$1(ctx) {
    	var input, t0, button, t1, t2, dispose;

    	return {
    		c: function create() {
    			input = element("input");
    			t0 = space();
    			button = element("button");
    			t1 = text("Count: ");
    			t2 = text(ctx.count);
    			attr(input, "type", "number");
    			add_location(input, file$1, 4, 0, 43);
    			add_location(button, file$1, 5, 0, 85);

    			dispose = [
    				listen(input, "input", ctx.input_input_handler),
    				listen(button, "click", ctx.click_handler)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, input, anchor);

    			input.value = ctx.count;

    			insert(target, t0, anchor);
    			insert(target, button, anchor);
    			append(button, t1);
    			append(button, t2);
    		},

    		p: function update(changed, ctx) {
    			if (changed.count) input.value = ctx.count;

    			if (changed.count) {
    				set_data(t2, ctx.count);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(input);
    				detach(t0);
    				detach(button);
    			}

    			run_all(dispose);
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let count = 0;

    	function input_input_handler() {
    		count = to_number(this.value);
    		$$invalidate('count', count);
    	}

    	function click_handler() {
    		const $$result = count += 1;
    		$$invalidate('count', count);
    		return $$result;
    	}

    	return {
    		count,
    		input_input_handler,
    		click_handler
    	};
    }

    class Counter extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment$1, safe_not_equal, []);
    	}
    }

    /* src\TempConverter.svelte generated by Svelte v3.6.1 */

    const file$2 = "src\\TempConverter.svelte";

    function create_fragment$2(ctx) {
    	var input0, t0, input1, t1, dispose;

    	return {
    		c: function create() {
    			input0 = element("input");
    			t0 = text("\r\n°C =\r\n");
    			input1 = element("input");
    			t1 = text("\r\n°F");
    			attr(input0, "type", "number");
    			input0.value = ctx.c;
    			attr(input0, "class", "svelte-yx6dg9");
    			add_location(input0, file$2, 21, 0, 327);
    			attr(input1, "type", "number");
    			input1.value = ctx.f;
    			attr(input1, "class", "svelte-yx6dg9");
    			add_location(input1, file$2, 23, 0, 411);

    			dispose = [
    				listen(input0, "input", ctx.input_handler),
    				listen(input1, "input", ctx.input_handler_1)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, input0, anchor);
    			insert(target, t0, anchor);
    			insert(target, input1, anchor);
    			insert(target, t1, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (changed.c) {
    				input0.value = ctx.c;
    			}

    			if (changed.f) {
    				input1.value = ctx.f;
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(input0);
    				detach(t0);
    				detach(input1);
    				detach(t1);
    			}

    			run_all(dispose);
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let c = 0;
        let f = 32;

        function setBothFromC(value) {
            $$invalidate('c', c = +value);
            $$invalidate('f', f = +(32 + (9 / 5 * c)).toFixed(1));
        }

        function setBothFromF(value) {
            $$invalidate('f', f = +value);
            $$invalidate('c', c = (5 / 9 * (f - 32)).toFixed(1));
        }

    	function input_handler(e) {
    		return setBothFromC(e.target.value);
    	}

    	function input_handler_1(e) {
    		return setBothFromF(e.target.value);
    	}

    	return {
    		c,
    		f,
    		setBothFromC,
    		setBothFromF,
    		input_handler,
    		input_handler_1
    	};
    }

    class TempConverter extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$2, safe_not_equal, []);
    	}
    }

    /* src\Timer.svelte generated by Svelte v3.6.1 */

    const file$3 = "src\\Timer.svelte";

    function create_fragment$3(ctx) {
    	var label0, t0, progress, progress_value_value, t1, p, t2_value = (ctx.elapsed / 1000).toFixed(1), t2, t3, t4, label1, t5, input, t6, br, t7, button, dispose;

    	return {
    		c: function create() {
    			label0 = element("label");
    			t0 = text("Elapsed time:\r\n\t");
    			progress = element("progress");
    			t1 = space();
    			p = element("p");
    			t2 = text(t2_value);
    			t3 = text(" seconds");
    			t4 = space();
    			label1 = element("label");
    			t5 = text("Duration:\r\n\t");
    			input = element("input");
    			t6 = space();
    			br = element("br");
    			t7 = space();
    			button = element("button");
    			button.textContent = "Reset Timer";
    			progress.value = progress_value_value = ctx.elapsed / ctx.duration;
    			add_location(progress, file$3, 35, 1, 584);
    			add_location(label0, file$3, 33, 0, 558);
    			attr(p, "class", "svelte-109f3yy");
    			add_location(p, file$3, 38, 0, 648);
    			attr(input, "type", "range");
    			attr(input, "min", "1");
    			attr(input, "max", "20000");
    			add_location(input, file$3, 42, 1, 718);
    			add_location(label1, file$3, 40, 0, 696);
    			add_location(br, file$3, 44, 0, 792);
    			add_location(button, file$3, 45, 0, 798);

    			dispose = [
    				listen(input, "change", ctx.input_change_input_handler),
    				listen(input, "input", ctx.input_change_input_handler),
    				listen(button, "click", ctx.click_handler)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, label0, anchor);
    			append(label0, t0);
    			append(label0, progress);
    			insert(target, t1, anchor);
    			insert(target, p, anchor);
    			append(p, t2);
    			append(p, t3);
    			insert(target, t4, anchor);
    			insert(target, label1, anchor);
    			append(label1, t5);
    			append(label1, input);

    			input.value = ctx.duration;

    			insert(target, t6, anchor);
    			insert(target, br, anchor);
    			insert(target, t7, anchor);
    			insert(target, button, anchor);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.elapsed || changed.duration) && progress_value_value !== (progress_value_value = ctx.elapsed / ctx.duration)) {
    				progress.value = progress_value_value;
    			}

    			if ((changed.elapsed) && t2_value !== (t2_value = (ctx.elapsed / 1000).toFixed(1))) {
    				set_data(t2, t2_value);
    			}

    			if (changed.duration) input.value = ctx.duration;
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(label0);
    				detach(t1);
    				detach(p);
    				detach(t4);
    				detach(label1);
    				detach(t6);
    				detach(br);
    				detach(t7);
    				detach(button);
    			}

    			run_all(dispose);
    		}
    	};
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let elapsed = 0;
    	let duration = 5000;

        let last_time = window.performance.now();
        let frame;
        
        (function update() {
    		frame = requestAnimationFrame(update);

    		const time = window.performance.now();
    		$$invalidate('elapsed', elapsed += Math.min(
    			time - last_time,
    			duration - elapsed
    		));

    		last_time = time;
    	}());

    	onDestroy(() => {
    		cancelAnimationFrame(frame);
    	});

    	function input_change_input_handler() {
    		duration = to_number(this.value);
    		$$invalidate('duration', duration);
    	}

    	function click_handler() {
    		const $$result = elapsed = 0;
    		$$invalidate('elapsed', elapsed);
    		return $$result;
    	}

    	return {
    		elapsed,
    		duration,
    		input_change_input_handler,
    		click_handler
    	};
    }

    class Timer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$3, safe_not_equal, []);
    	}
    }

    /* src\CrudApp.svelte generated by Svelte v3.6.1 */

    const file$4 = "src\\CrudApp.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.frame = list[i];
    	child_ctx.i = i;
    	return child_ctx;
    }

    // (85:1) {#each filteredFrames as frame, i}
    function create_each_block(ctx) {
    	var option, t0_value = ctx.frame.description, t0, t1, t2_value = ctx.frame.frame, t2;

    	return {
    		c: function create_1() {
    			option = element("option");
    			t0 = text(t0_value);
    			t1 = text(", ");
    			t2 = text(t2_value);
    			option.__value = ctx.i;
    			option.value = option.__value;
    			add_location(option, file$4, 85, 2, 1787);
    		},

    		m: function mount(target, anchor) {
    			insert(target, option, anchor);
    			append(option, t0);
    			append(option, t1);
    			append(option, t2);
    		},

    		p: function update_1(changed, ctx) {
    			if ((changed.filteredFrames) && t0_value !== (t0_value = ctx.frame.description)) {
    				set_data(t0, t0_value);
    			}

    			if ((changed.filteredFrames) && t2_value !== (t2_value = ctx.frame.frame)) {
    				set_data(t2, t2_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(option);
    			}
    		}
    	};
    }

    function create_fragment$4(ctx) {
    	var input0, t0, select, t1, label0, input1, t2, label1, input2, t3, div, button0, t4, button0_disabled_value, t5, button1, t6, button1_disabled_value, t7, button2, t8, button2_disabled_value, dispose;

    	var each_value = ctx.filteredFrames;

    	var each_blocks = [];

    	for (var i_1 = 0; i_1 < each_value.length; i_1 += 1) {
    		each_blocks[i_1] = create_each_block(get_each_context(ctx, each_value, i_1));
    	}

    	return {
    		c: function create_1() {
    			input0 = element("input");
    			t0 = space();
    			select = element("select");

    			for (var i_1 = 0; i_1 < each_blocks.length; i_1 += 1) {
    				each_blocks[i_1].c();
    			}

    			t1 = space();
    			label0 = element("label");
    			input1 = element("input");
    			t2 = space();
    			label1 = element("label");
    			input2 = element("input");
    			t3 = space();
    			div = element("div");
    			button0 = element("button");
    			t4 = text("Create");
    			t5 = space();
    			button1 = element("button");
    			t6 = text("Update");
    			t7 = space();
    			button2 = element("button");
    			t8 = text("Delete");
    			attr(input0, "placeholder", "Filter by adjective");
    			attr(input0, "class", "svelte-1sc6p6q");
    			add_location(input0, file$4, 81, 0, 1649);
    			if (ctx.i === void 0) add_render_callback(() => ctx.select_change_handler.call(select));
    			attr(select, "size", 4);
    			attr(select, "class", "svelte-1sc6p6q");
    			add_location(select, file$4, 83, 0, 1714);
    			attr(input1, "placeholder", "Framework");
    			attr(input1, "class", "svelte-1sc6p6q");
    			add_location(input1, file$4, 89, 7, 1880);
    			add_location(label0, file$4, 89, 0, 1873);
    			attr(input2, "placeholder", "Description");
    			attr(input2, "class", "svelte-1sc6p6q");
    			add_location(input2, file$4, 90, 7, 1947);
    			add_location(label1, file$4, 90, 0, 1940);
    			button0.disabled = button0_disabled_value = !ctx.frame || !ctx.description;
    			add_location(button0, file$4, 93, 1, 2041);
    			button1.disabled = button1_disabled_value = !ctx.frame || !ctx.description || !ctx.selected;
    			add_location(button1, file$4, 94, 1, 2121);
    			button2.disabled = button2_disabled_value = !ctx.selected;
    			add_location(button2, file$4, 95, 1, 2214);
    			attr(div, "class", "buttons svelte-1sc6p6q");
    			add_location(div, file$4, 92, 0, 2017);

    			dispose = [
    				listen(input0, "input", ctx.input0_input_handler),
    				listen(select, "change", ctx.select_change_handler),
    				listen(input1, "input", ctx.input1_input_handler),
    				listen(input2, "input", ctx.input2_input_handler),
    				listen(button0, "click", ctx.create),
    				listen(button1, "click", ctx.update),
    				listen(button2, "click", ctx.remove)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, input0, anchor);

    			input0.value = ctx.prefix;

    			insert(target, t0, anchor);
    			insert(target, select, anchor);

    			for (var i_1 = 0; i_1 < each_blocks.length; i_1 += 1) {
    				each_blocks[i_1].m(select, null);
    			}

    			select_option(select, ctx.i);

    			insert(target, t1, anchor);
    			insert(target, label0, anchor);
    			append(label0, input1);

    			input1.value = ctx.frame;

    			insert(target, t2, anchor);
    			insert(target, label1, anchor);
    			append(label1, input2);

    			input2.value = ctx.description;

    			insert(target, t3, anchor);
    			insert(target, div, anchor);
    			append(div, button0);
    			append(button0, t4);
    			append(div, t5);
    			append(div, button1);
    			append(button1, t6);
    			append(div, t7);
    			append(div, button2);
    			append(button2, t8);
    		},

    		p: function update_1(changed, ctx) {
    			if (changed.prefix && (input0.value !== ctx.prefix)) input0.value = ctx.prefix;

    			if (changed.filteredFrames) {
    				each_value = ctx.filteredFrames;

    				for (var i_1 = 0; i_1 < each_value.length; i_1 += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i_1);

    					if (each_blocks[i_1]) {
    						each_blocks[i_1].p(changed, child_ctx);
    					} else {
    						each_blocks[i_1] = create_each_block(child_ctx);
    						each_blocks[i_1].c();
    						each_blocks[i_1].m(select, null);
    					}
    				}

    				for (; i_1 < each_blocks.length; i_1 += 1) {
    					each_blocks[i_1].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}

    			if (changed.i) select_option(select, ctx.i);
    			if (changed.frame && (input1.value !== ctx.frame)) input1.value = ctx.frame;
    			if (changed.description && (input2.value !== ctx.description)) input2.value = ctx.description;

    			if ((changed.frame || changed.description) && button0_disabled_value !== (button0_disabled_value = !ctx.frame || !ctx.description)) {
    				button0.disabled = button0_disabled_value;
    			}

    			if ((changed.frame || changed.description || changed.selected) && button1_disabled_value !== (button1_disabled_value = !ctx.frame || !ctx.description || !ctx.selected)) {
    				button1.disabled = button1_disabled_value;
    			}

    			if ((changed.selected) && button2_disabled_value !== (button2_disabled_value = !ctx.selected)) {
    				button2.disabled = button2_disabled_value;
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(input0);
    				detach(t0);
    				detach(select);
    			}

    			destroy_each(each_blocks, detaching);

    			if (detaching) {
    				detach(t1);
    				detach(label0);
    				detach(t2);
    				detach(label1);
    				detach(t3);
    				detach(div);
    			}

    			run_all(dispose);
    		}
    	};
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let frames = [
            {
                frame: 'Svelte',
                description: 'Amazing'
            },
            {
                frame: 'Vue',
                description: 'Good'
            },
            {
                frame: 'React',
                description: 'Not reactive'
            },
            {
                frame: 'Angular',
                description: 'Difficult'
            }
        ];

        let prefix = '';
    	let frame = '';
    	let description = '';
        let i = 0;


        function create() {
    		$$invalidate('frames', frames = frames.concat({ frame, description }));
    		$$invalidate('i', i = frames.length - 1);
    		$$invalidate('frame', frame = description = ''); $$invalidate('description', description);
    	}

    	function update() {
    		frames[i] = { frame, description }; $$invalidate('frames', frames);
    	}

    	function remove() {
    		// Remove selected frame from the source array (frames), not the filtered array
    		const index = frames.indexOf(selected);
    		$$invalidate('frames', frames = [...frames.slice(0, index), ...frames.slice(index + 1)]);

    		$$invalidate('frame', frame = description = ''); $$invalidate('description', description);
    		$$invalidate('i', i = Math.min(i, filteredFrames.length - 2));
    	}

    	function reset_inputs(person) {
    		$$invalidate('frame', frame = person ? person.frame : '');
    		$$invalidate('description', description = person ? person.description : '');
    	}

    	function input0_input_handler() {
    		prefix = this.value;
    		$$invalidate('prefix', prefix);
    	}

    	function select_change_handler() {
    		i = select_value(this);
    		$$invalidate('i', i);
    	}

    	function input1_input_handler() {
    		frame = this.value;
    		$$invalidate('frame', frame);
    	}

    	function input2_input_handler() {
    		description = this.value;
    		$$invalidate('description', description);
    	}

    	let filteredFrames, selected;

    	$$self.$$.update = ($$dirty = { prefix: 1, frames: 1, filteredFrames: 1, i: 1, selected: 1 }) => {
    		if ($$dirty.prefix || $$dirty.frames) { $$invalidate('filteredFrames', filteredFrames = prefix
    				? frames.filter(frame => {
    					const name = `${frame.description} - ${frame.frame}`;
    					return name.toLowerCase().startsWith(prefix.toLowerCase());
    				})
    				: frames); }
    		if ($$dirty.filteredFrames || $$dirty.i) { $$invalidate('selected', selected = filteredFrames[i]); }
    		if ($$dirty.selected) { reset_inputs(selected); }
    	};

    	return {
    		prefix,
    		frame,
    		description,
    		i,
    		create,
    		update,
    		remove,
    		filteredFrames,
    		selected,
    		input0_input_handler,
    		select_change_handler,
    		input1_input_handler,
    		input2_input_handler
    	};
    }

    class CrudApp extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$4, safe_not_equal, []);
    	}
    }

    /* src\Footer.svelte generated by Svelte v3.6.1 */

    const file$5 = "src\\Footer.svelte";

    function create_fragment$5(ctx) {
    	var footer, a;

    	return {
    		c: function create() {
    			footer = element("footer");
    			a = element("a");
    			a.textContent = "SVELTE.js Presentation - A Must Watch";
    			attr(a, "href", "https://www.youtube.com/watch?v=AdNJ3fydeao");
    			attr(a, "target", "_blank");
    			attr(a, "class", "svelte-75c4af");
    			add_location(a, file$5, 19, 4, 347);
    			attr(footer, "class", "svelte-75c4af");
    			add_location(footer, file$5, 18, 0, 333);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, footer, anchor);
    			append(footer, a);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(footer);
    			}
    		}
    	};
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$5, safe_not_equal, []);
    	}
    }

    /* src\App.svelte generated by Svelte v3.6.1 */

    const file$6 = "src\\App.svelte";

    function create_fragment$6(ctx) {
    	var t0, div, h30, t2, t3, hr0, t4, h31, t6, t7, hr1, t8, h32, t10, t11, hr2, t12, h33, t14, t15, current;

    	var header = new Header({ $$inline: true });

    	var counter = new Counter({ $$inline: true });

    	var tempconverter = new TempConverter({ $$inline: true });

    	var timer = new Timer({ $$inline: true });

    	var crudapp = new CrudApp({ $$inline: true });

    	var footer = new Footer({ $$inline: true });

    	return {
    		c: function create() {
    			header.$$.fragment.c();
    			t0 = space();
    			div = element("div");
    			h30 = element("h3");
    			h30.textContent = "Counter";
    			t2 = space();
    			counter.$$.fragment.c();
    			t3 = space();
    			hr0 = element("hr");
    			t4 = space();
    			h31 = element("h3");
    			h31.textContent = "Temperature Converter";
    			t6 = space();
    			tempconverter.$$.fragment.c();
    			t7 = space();
    			hr1 = element("hr");
    			t8 = space();
    			h32 = element("h3");
    			h32.textContent = "Timer";
    			t10 = space();
    			timer.$$.fragment.c();
    			t11 = space();
    			hr2 = element("hr");
    			t12 = space();
    			h33 = element("h3");
    			h33.textContent = "CRUD App";
    			t14 = space();
    			crudapp.$$.fragment.c();
    			t15 = space();
    			footer.$$.fragment.c();
    			add_location(h30, file$6, 35, 1, 620);
    			add_location(hr0, file$6, 39, 1, 652);
    			add_location(h31, file$6, 41, 1, 659);
    			add_location(hr1, file$6, 45, 1, 711);
    			add_location(h32, file$6, 47, 1, 718);
    			add_location(hr2, file$6, 51, 1, 746);
    			add_location(h33, file$6, 53, 1, 753);
    			attr(div, "class", "container svelte-1m9prnf");
    			add_location(div, file$6, 34, 0, 595);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			mount_component(header, target, anchor);
    			insert(target, t0, anchor);
    			insert(target, div, anchor);
    			append(div, h30);
    			append(div, t2);
    			mount_component(counter, div, null);
    			append(div, t3);
    			append(div, hr0);
    			append(div, t4);
    			append(div, h31);
    			append(div, t6);
    			mount_component(tempconverter, div, null);
    			append(div, t7);
    			append(div, hr1);
    			append(div, t8);
    			append(div, h32);
    			append(div, t10);
    			mount_component(timer, div, null);
    			append(div, t11);
    			append(div, hr2);
    			append(div, t12);
    			append(div, h33);
    			append(div, t14);
    			mount_component(crudapp, div, null);
    			insert(target, t15, anchor);
    			mount_component(footer, target, anchor);
    			current = true;
    		},

    		p: noop,

    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);

    			transition_in(counter.$$.fragment, local);

    			transition_in(tempconverter.$$.fragment, local);

    			transition_in(timer.$$.fragment, local);

    			transition_in(crudapp.$$.fragment, local);

    			transition_in(footer.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(counter.$$.fragment, local);
    			transition_out(tempconverter.$$.fragment, local);
    			transition_out(timer.$$.fragment, local);
    			transition_out(crudapp.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(header, detaching);

    			if (detaching) {
    				detach(t0);
    				detach(div);
    			}

    			destroy_component(counter, );

    			destroy_component(tempconverter, );

    			destroy_component(timer, );

    			destroy_component(crudapp, );

    			if (detaching) {
    				detach(t15);
    			}

    			destroy_component(footer, detaching);
    		}
    	};
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$6, safe_not_equal, []);
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
