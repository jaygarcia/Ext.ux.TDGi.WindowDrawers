/*
    Author       : Jay Garcia
    Site         : http://tdg-i.com
    Contact Info : jgarcia@tdg-i.com
    Purpose      : Window Drawers for Ext 2.x Ext.Window class, which emulates OS X behaviors
	Contributors : Mystix, http://extjs.com/forum/member.php?u=1459
	 			   Hendricd, http://extjs.com/forum/member.php?u=8730

    Warranty     : none
    Price        : free
    Version      : 1.0
    Date         : 06/08/2010
*/
Ext.ns('Ext.ux.plugins');

// Drawer Base Class
Ext.ux.plugins.WindowDrawer = Ext.extend(Ext.Window, {
    closable : false,
    resizable : false,
    frame           : true,
    draggable       : false,
    modal           : false,
    closeAction     : 'hide',
    show : function(skipAnim) {
        if (this.hidden && this.fireEvent("beforeshow", this) !== false) {
            this.hidden = false;
            this.onBeforeShow();
            this.afterShow(!!skipAnim);
        }
    },

    hide : function(skipAnim) {
        if (this.hidden) {
            return;
        }

        if (this.animate === true && !skipAnim) {
            if (this.el.shadow) { // honour WindowDrawer's "shadow" config
                this.el.disableShadow();
            }

            this.el.slideOut(this.alignToParams.slideDirection, {
                duration : this.animDuration || .25,
                callback : this.onAfterAnimHide,
                scope    : this
            });
        } else {
            Ext.ux.plugins.WindowDrawer.superclass.hide.call(this);
        }

        // REQUIRED!!!
        this.hidden = true;
    },

    // private
    init : function(parent) {
        this.win = parent;
        this.alignToParams = {};
        this.resizeHandles = this.side; // allow resizing only on 1 side (if resizing is allowed)

        parent.drawers = parent.drawers || {};
        parent.drawers[this.side] = this; // add this WindowDrawer to the parent's drawer collection
        parent.on({
            scope         : this,
            tofront       : this.onBeforeShow,
            toback        : this.onBeforeShow,
            resize        : this.alignAndShow,
            show          : this.alignAndShow,
            beforedestroy : this.destroy,
            afterrender   : function(p) {
                // render WindowDrawer to parent's container, if available
                this.renderTo = p.el;
            }
        });

        /**
         * Manage the ghosting, but NOT for IE, which is a complete fail.  IE's filter css prevents the child ghost
         * from appearing.
         */


        if (! Ext.isIE) {
            var drawer =  this;
            parent.ghost = parent.ghost.createSequence(function() {
                if (drawer.el && ! drawer.hidden) {
                    var winGhost    = this.activeGhost,
                        drawerGhost = drawer.ghost();

                    winGhost.appendChild(drawerGhost);
                    drawerGhost.anchorTo(winGhost.dom, drawer.alignToParams.alignTo, drawer.alignToParams.alignToXY);
                    drawerGhost.applyStyles('z-index: -1;');
                    winGhost.applyStyles('overflow: visible;');
                }
            });
            parent.unghost = parent.unghost.createInterceptor(function() {
                if (drawer.activeGhost) {
                    drawer.unghost();
                }
            });
        }

    },

    // private
    initComponent : function() {

        this.on({
			beforeshow : {
				scope : this,
				fn    : this.onBeforeShow
			},
			beforehide: {
				scope : this,
				fn    : this.onBeforeHide
			}
		});

        if (this.size) {
            if (this.side == 'e' || this.side == 'w') {
                this.width = this.size;
            } else {
                this.height = this.size;
            }
        }

        Ext.ux.plugins.WindowDrawer.superclass.initComponent.apply(this);

    },

    // private
    onBeforeResize : function() {
        if (!this.hidden) {
            this.showAgain = true;
        }
        this.hide(true);
    },

	//private
	onBeforeHide : function() {
		if (this.animate) {
			this.getEl().addClass('x-panel-animated');
		}
	},
    /**
     * @private
     *
     */
	onAfterAnimHide : function() {
        this.el.setVisible(false);
    },

    // private
    onBeforeShow : function() {
        if (! this.rendered) {
            this.render(this.renderTo);
        }
		this.el.addClass('x-panel-animated');
        this.setAlignment();
        this.setZIndex();
    },

    // private
    afterShow : function(skipAnim) {
        if (this.animate && !skipAnim) {
			this.getEl().removeClass('x-panel-animated');
            this.el.slideIn(this.alignToParams.slideDirection, {
                scope    : this,
                duration : this.animDuration || .25,
                callback : function() {
                    if (this.el.shadow) { // honour WindowDrawer's "shadow" config
                        // re-enable shadows after animation
                        this.el.enableShadow(true);
                    }

                    // REQUIRED!!
                    this.el.show(); // somehow forces the shadow to appear
                }
            });
        }
		else {

            Ext.ux.plugins.WindowDrawer.superclass.afterShow.call(this);
        }
    },

    // private
    alignAndShow : function() {
        this.setAlignment();

        if (this.showAgain) {
            this.show(true);
        }
        this.showAgain = false;
    },

    // private
    setAlignment:  function() {
        if (! this.el) {
            return;
        }
        switch(this.side) {
            case 'n' :
                this.setWidth(this.win.el.getWidth() - 10);
                Ext.apply(this.alignToParams, {
                    alignTo        : 'tl',
                    alignToXY      :  [5, (this.el.getComputedHeight() * -1) + 5],
                    slideDirection : 'b'
                });
                break;

            case 's' :
                this.setWidth(this.win.el.getWidth() - 10);
                Ext.apply(this.alignToParams, {
                    alignTo        : 'bl',
                    alignToXY      :  [5, (Ext.isIE6)? -2 : -7],
                    slideDirection : 't'
                });
                break;

            case 'e' :
                this.setHeight(this.win.el.getHeight() - 10);
                Ext.apply(this.alignToParams, {
                    alignTo        : 'tr',
                    alignToXY      :  [-5, 5],
                    slideDirection : 'l'
                });
                break;

            case 'w' :
                this.setHeight(this.win.el.getHeight() - 10);
                Ext.apply(this.alignToParams, {
                    alignTo        : 'tl',
                    alignToXY      :  [(this.el.getComputedWidth() * -1) + 5, 5],
                    slideDirection : 'r'
                });
                break;
        }

        if (!this.hidden) {
            this.el.alignTo(this.win.el, this.alignToParams.alignTo, this.alignToParams.alignToXY);

            // Simple fix for IE, where the bwrap doesn't properly resize.
            if (Ext.isIE) {
                this.bwrap.hide();
                this.bwrap.show();
            }
        }

        // force doLayout()
        this.doLayout();
    },
    setZIndex : function() {
        return this.constructor.superclass.setZIndex.call(this, -3);
    },

    // private
    toFront: Ext.emptyFn
});
