/// <reference path="./typings/tsd.d.ts" />
/**
 * Museum jQuery plugin
 * Jari Pennanen, 2016
 * MIT License
 * https://github.com/ciantic/museum/
 */

interface JQuery {
    swipe: any
}

// JQueryCallback is not working here because it's not generic
interface JQueryCallbackGeneric<T extends Function> {
    add(callback: T): JQueryCallbackGeneric<T>;
    remove(callback: T): JQueryCallbackGeneric<T>
    empty(): JQueryCallbackGeneric<T>
    fire: T
}

(function ($: JQueryStatic) {
    
    function cyclic(i: number, count: number) {
        var n = i % count;
        if (n < 0)
            return n + count;
        return n;
    }
    
    function handle(fn: Function, context: any) {
        return function (e: JQueryEventObject) {
            fn.call(context);
            e.preventDefault();
        }
    }
    
    var defaultTemplate = `
        <museum-overlay>
            <museum-gallery>
                <museum-gallery-item class="uninitialized"></museum-gallery-item>
            </museum-gallery>
            <museum-nav tabindex="-1">
                <a href="#" class="museum-btn museum-btn-close"></a>
                <museum-page></museum-page>
                <a href="#" class="museum-btn museum-btn-toc"></a>
                <a href="#" class="museum-btn museum-btn-next"></a>
                <a href="#" class="museum-btn museum-btn-prev"></a>
                <a href="#" class="museum-btn museum-btn-info"></a>
            </museum-nav>
            <museum-info><museum-info-content></museum-info-content></museum-info>
            <museum-toc>
                <a href="#" class="museum-toc-row"></a>
            </museum-toc>
        </museum-overlay> 
    `;

    interface MuseumItem {
        el : () => HTMLElement
        toc : string
        info : string
        page : string
    }
    
    interface MuseumOpts {
        id? : string
        classes? : string
        items? : MuseumItem[]
        circular? : boolean
        template? : string
        useInfo? : boolean
        useToc? : boolean
    }
    
    class Museum {
        id : string;
        
        private classes : string;
        private items : MuseumItem[];
        private circular : boolean;
        private template : string;
        private useInfo : boolean;
        private useToc : boolean;
        
        private el : HTMLElement;
        private galleryEl : HTMLElement;
        private galleryItemTemplateEl : HTMLElement;
        private tocEl : HTMLElement;
        private tocRowTemplateEl : HTMLElement;
        private infoContentEl : HTMLElement;
        private pageEl : HTMLElement;
        private currentEl : HTMLElement;
        
        private current : number = 0;
        private wasFocused: JQuery;
        
        onShowItem: JQueryCallbackGeneric<(n: number, item: MuseumItem) => void> = $.Callbacks();
        onShow: JQueryCallbackGeneric<() => void> = $.Callbacks();
        onHide: JQueryCallbackGeneric<() => void> = $.Callbacks();
        
        constructor({
            id = "", 
            classes = "", 
            items = [], 
            circular = true, 
            template = defaultTemplate,
            useInfo = true,
            useToc = true 
        }: MuseumOpts) {
            this.id = id;
            this.classes = classes;
            this.items = items;
            this.circular = circular;
            this.template = template;
            this.useInfo = useInfo;
            this.useToc = useToc;
        }
        
        private keyboardEventHandler = $.proxy(this.keyboardEvent, this);
        private keyboardEvent(e: JQueryKeyEventObject) {
            if (e.keyCode == 39) {
                this.next();
            } else if (e.keyCode == 37) {
                this.prev();
            } else if (e.keyCode == 27) {
                this.hide();
            }
        }
        
        private selectToc(e: JQueryKeyEventObject) {
            var i = $(e.currentTarget).data('i');
            this.showItem(i);
            if ($(window).width() < 550) {
                this.toc();
            }
            e.preventDefault();
        }
        
        private uninit(i: number) {
            var self = this;
            if (i >= this.items.length || i < 0) {
                return this;
            }
            var galleryItemEl = $(this.galleryEl).children().eq(i);
            if (galleryItemEl.is('.uninitialized')) {
                return this;
            }
            
            galleryItemEl.replaceWith($(self.galleryItemTemplateEl).clone());
        }
        
        private init(i: number = 0) {
            if (i >= this.items.length || i < 0) {
                return this;
            }
            
            var item = this.items[i]
            if (!item) {
                return;
            }
            
            var galleryItemEl = $(this.galleryEl).children().eq(i);
            if (!galleryItemEl.is('.uninitialized')) {
                return this;
            }
            
            galleryItemEl.removeClass("uninitialized");
            galleryItemEl.append(item.el);
            return this;
        }
        
        render() {
            if (this.el) {
                return;
            }
            var self = this;
            this.el = $(this.template).addClass(this.classes).appendTo("body").get(0);
            this.galleryEl = $(this.el).find('museum-gallery').get(0);
            this.galleryItemTemplateEl = $(this.galleryEl).children().detach().get(0);
            this.pageEl = $(this.el).find('museum-page').get(0);
            this.tocEl = $(this.el).find('museum-toc').get(0);
            this.tocRowTemplateEl = $(this.tocEl).children().detach().get(0); 
            this.infoContentEl =  $(this.el).find('museum-info-content').get(0);
            var hasToc = false,
                hasInfo = false;
                
            $.each(this.items, function (i, item) {
                $(self.galleryItemTemplateEl).clone().appendTo(self.galleryEl);
                
                if (self.useInfo && item.info) {
                    hasInfo = true;
                }
                if (self.useToc && item.toc) {
                    hasToc = true;
                    $(self.tocRowTemplateEl).clone().text(item.toc).attr('data-i', i).appendTo(self.tocEl);
                }
            });
            
            this.currentEl = $(this.galleryEl).children().eq(this.current).get(0);
            
            $(this.el).toggleClass('has-toc', self.useToc && hasToc);
            $(this.el).toggleClass('has-info', self.useInfo && hasInfo);
            $(this.el).on("click", "a.museum-toc-row", $.proxy(this.selectToc, this));
            $(this.el).on("click", ".museum-btn-next", handle(this.next, this));
            $(this.el).on("click", ".museum-btn-prev", handle(this.prev, this));
            $(this.el).on("click", ".museum-btn-toc", handle(this.toc, this));
            $(this.el).on("click", ".museum-btn-close", handle(this.hide, this));
            $(this.el).on("click", ".museum-btn-info", handle(this.info, this));
            if ($.fn.swipe) {
                $(this.el).swipe({
                    swipeLeft : () => {
                        self.next()
                    },
                    swipeRight : () => {
                        self.prev();
                    }
                });
            }
        }
        
        info() {
            $(this.el).toggleClass("info-shown");
        }
        
        toc() {
            $(this.el).toggleClass("toc-shown");
        }
        
        next() {
            this.showItem(this.current + 1);
        }
        
        prev() {
            this.showItem(this.current - 1);
        }
        
        show(n: number = 0) {
            this.render();
            var self = this;
            
            $("body").addClass('museum-overlay-shown');
            $(this.el).removeClass('hidden').addClass('shown');
            $(window).bind("keydown", this.keyboardEventHandler);
            this.showItem(n);
            
            // Set the focus
            this.wasFocused = $(document.activeElement);
            var focusable = $(this.el).find("button");
            focusable.eq(-1).on("blur", function () {
                focusable.first().focus();
            });
            focusable.first().parent().focus();
            this.onShow.fire();
        }
        
        private showItem(n: number = 0) {
            var self = this;
            
            // Cyclic from left and right
            if (this.circular) {
                n = cyclic(n, this.items.length);
                
            // Not cyclic
            } else {
                if (n >= this.items.length) {
                    n = this.items.length - 1;
                } else if (n < 0) {
                    n = 0;
                }
                $(this.el)
                    .toggleClass('on-first-item', n == 0)
                    .toggleClass('on-last-item', n == (this.items.length - 1));
            }
            
            var item = this.items[n];
            if (!item) {
                return this;
            }
            if (this.current != n) {
                this.uninit(this.current);
            }
            this.init(n);
            this.current = n;
            this.currentEl = $(this.galleryEl).children().removeClass('shown').eq(n).addClass('shown').get(0);
            $(this.tocEl).children().removeClass('active').filter("[data-i="+n+"]").addClass('active');
            $(this.infoContentEl).html(item.info);
            $(this.pageEl).text(item.page || ((this.current + 1) + " / " + this.items.length));
            
            // Preload next after 300ms
            setTimeout(function() {
                self.init(n + 1);      
            }, 300);
            
            this.onShowItem.fire(n, item);
            
            return this;
        }
        
        hide() {
            var self = this;
            $("body").removeClass('museum-overlay-shown');
            $(this.el).addClass('hidden').removeClass('shown');
            $(window).unbind("keydown", this.keyboardEventHandler);
            $(this.wasFocused).focus();
            setTimeout(function() {
                if ($.fn.swipe) {
                    $(self.el).swipe("destroy");
                }
                $(self.el).unbind("click");
                $(self.el).remove();
                self.el = null;    
                self.galleryEl = null;
                self.galleryItemTemplateEl = null;
                self.tocEl = null;
                self.tocRowTemplateEl = null;
                self.infoContentEl = null;
                self.pageEl = null;
                self.currentEl 
            }, 0);
            this.onHide.fire();
            return this;
        }
        
        destroy() {
            this.hide();
        }
        
        add(item: MuseumItem) {
            this.items.push(item);
            return this.items.length - 1;
        }
        
        addFromEl(el: HTMLElement) {
            var showEl: () => HTMLElement = null,
                toc = $(el).data('toc') || "",
                info = $(el).find("[data-info]"),
                page = $(el).data('page') || "";
                
            // data-html string is given
            if ($(el).data("html")) {
                showEl = () => $(el).data("html");
                
            // data-selector string is given
            } else if ($(el).data("selector")) {
                showEl = () => $($(el).data("selector")).clone().get(0);
                
            // data-image string is given
            } else if($(el).data('image')) {
                showEl = () => $("<i class='img'></i>").css('background-image', 'url(' + $(el).data('image') + ')').get(0);
                    
            // Is href link to image
            } else if($(el).attr('href') && $(el).attr('href').match(".jpeg|.jpg$|.png|.gif$")) {
                showEl = () => $("<i class='img'></i>").css('background-image', 'url(' + $(el).attr('href') + ')').get(0); 
            }
            var item: MuseumItem = {
                toc : toc,
                info : info.html() || "",
                el : showEl,
                page : page
            };
            
            return this.add(item);
        }
    }
    
    // Orchestrates multiple museums and handles the hash navigation
    class MuseumManager {
        constructor() {
            var self = this;
            setTimeout(function () {
                self.openHash(); 
            }, 5); 
            setTimeout(function () {
                self.openHash(); 
            }, 500); 
        }
        
        private museums: { [id: string] : Museum } = {};
        
        private openHash() {
            var m: any;
            if (m = /gallery-?(.*):(\d+)/.exec(location && location.hash || "")) {
                var id = m[1],
                    n = parseInt(m[2]);
                if (this.museums[id]) {
                    this.museums[id].show(n);
                }
            }
        }
        
        private navHash(m: Museum, n: number) {
            if (history && history.replaceState && location.protocol != "file:") {
                var hash = "gallery" + (m.id ? "-" + m.id : "") + ":" + n;
                history.replaceState('', '', "#" + hash);
            }
        }
        
        private emptyHash() {
            if (history && history.replaceState && location.protocol != "file:") {
                history.replaceState('', '', "#");
            }
        }
        
        getOrCreate(opts: MuseumOpts) {
            if (this.museums[opts.id]) {
                return this.museums[opts.id];
            } else {
                var self = this,
                    m = new Museum(opts);
                    
                m.onShowItem.add(function (n) {
                    self.navHash(m, n);
                });
                
                m.onHide.add(function () {
                    self.emptyHash();
                });
                
                this.museums[opts.id] = m;
                return m;
            }
        }
        
        destroy(id: string) {
            if (this.museums[id]) {
                this.museums[id].destroy();
                delete this.museums[id];
            }
        }
    }
    
    var museumManager = new MuseumManager();

    jQuery.fn.museum = function(opts?: MuseumOpts) {
        this.each(function () {
            var id = $(this).attr('data-gallery') || "",
                museum = museumManager.getOrCreate(opts || {
                    id : id,
                    classes : id ? ("gallery-" + id) : ""
                });
                
            var n = 0;
            if (!opts || (opts && opts.items.length == 0)) {
                n = museum.addFromEl(this)
            }
            
            $(this).click(function (e) {
                museum.show(n);
                e.preventDefault();
            });
        });
        
        return this;
    };
})(jQuery);