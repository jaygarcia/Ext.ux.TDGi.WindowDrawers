/*
    Author       : Jay Garcia
    Site         : http://tdg-i.com
    Contact Info : jgarcia@tdg-i.com
    Purpose      : Window Drawers for Ext 2.x Ext.Window class, which emulates OS X behaviors
	Contributors : Mystix, http://extjs.com/forum/member.php?u=1459
	 			   Hendricd, http://extjs.com/forum/member.php?u=8730

    Warranty     : none
    license      : GPLV3
    Price        : free
    Version      : 1.0
    Date         : 06/08/2010
*/


/**
* @class Ext.plugins.TDGi.WindowDrawer
* @extends Ext.Window
* <p>Window Drawers for Ext 3.x Ext.Window class, which emulates OS X behavior.</p>
* @constructor
* @param {Object} config The config object
*/
Ext.ns('Ext.plugins.TDGi');

// Drawer Base Class
Ext.plugins.TDGi.WindowDrawer = Ext.extend(Ext.Window, {
    /**
     * suggested
     * configs
     */
    closable    : false,
    resizable   : false,
    frame       : true,
    draggable   : false,
    modal       : false,
    closeAction : 'hide',
    /**
     * Show the drawer.
     * @publich
     * @param {Boolean} skipAnim Skip animation
     */
    show : function(skipAnim) {
        var me = this;
        if (me.hidden && me.fireEvent("beforeshow", me) !== false) {
            me.hidden = false;
            me.onBeforeShow();
            me.afterShow(!!skipAnim);
        }
    },

    // private
    toFront: Ext.emptyFn,
    /**
     * Hide the drawer.
     * @publich
     * @param {Boolean} skipAnim Skip animation
     */
    hide : function(skipAnim) {
        var me = this;

        if (me.hidden) {
            return;
        }

        if (me.animate === true && !skipAnim) {
            if (me.el.shadow) { // honour WindowDrawer's "shadow" config
                me.el.disableShadow();
            }

            me.el.slideOut(me.alignToParams.slideDirection, {
                duration : me.animDuration || .25,
                callback : me.onAfterAnimHide,
                scope    : me
            });
        } else {
            Ext.plugins.TDGi.WindowDrawer.superclass.hide.call(me);
        }

        // REQUIRED!!!
        me.hidden = true;
    },

    // private
    init : function(parent) {
        var me = this;
        me.win = parent;
        me.alignToParams = {};
        me.resizeHandles = me.side; // allow resizing only on 1 side (if resizing is allowed)

        parent.drawers = parent.drawers || {};
        parent.drawers[me.side] = me; // add me WindowDrawer to the parent's drawer collection

        parent.on({
            scope         : me,
            tofront       : me.onBeforeShow,
            toback        : me.onBeforeShow,
            resize        : me.alignAndShow,
            show          : me.alignAndShow,
            beforedestroy : me.destroy,
            afterrender   : function(p) {
                // render WindowDrawer to parent's container, if available
                me.renderTo = p.el;
            }
        });

        /**
         * Manage the ghosting, but NOT for IE, which is a complete fail.  IE's filter css prevents the child ghost
         * from appearing.
         */
        if (! Ext.isIE) {
            var drawer =  me;  // help keep the sanity!
            parent.ghost = parent.ghost.createSequence(function() {
                if (drawer.el && ! drawer.hidden) {
                    var winGhost    = this.activeGhost,  // this == parent window
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
        var me = this;

        me.on({                                                     
			beforeshow : {
				scope : me,
				fn    : me.onBeforeShow
			},
			beforehide: {
				scope : me,
				fn    : me.onBeforeHide
			}
		});

        if (me.size) {
            if (me.side == 'e' || me.side == 'w') {
                me.width = me.size;
            } else {
                me.height = me.size;
            }
        }

        Ext.plugins.TDGi.WindowDrawer.superclass.initComponent.apply(me);

    },

    // private
    onBeforeResize : function() {
        var me = this;

        if (!me.hidden) {
            me.showAgain = true;
        }
        me.hide(true);
    },

	//private
	onBeforeHide : function() {
        var me = this;
		if (me.animate) {
			me.getEl().addClass('x-panel-animated');
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
        var me = this;

        if (! me.rendered) {
            me.render(me.renderTo);
        }
		me.el.addClass('x-panel-animated');
        me.setAlignment();
        me.setZIndex();
    },

    // private
    afterShow : function(skipAnim) {
        var me = this;
        if (me.animate && !skipAnim) {
			me.getEl().removeClass('x-panel-animated');
            me.el.slideIn(me.alignToParams.slideDirection, {
                scope    : me,
                duration : me.animDuration || .25,
                callback : function() {
                    if (me.el.shadow) { // honour WindowDrawer's "shadow" config
                        // re-enable shadows after animation
                        me.el.enableShadow(true);
                    }

                    // REQUIRED!!
                    me.el.show(); // somehow forces the shadow to appear
                }
            });
        }
		else {

            Ext.plugins.TDGi.WindowDrawer.superclass.afterShow.call(me);
        }
    },

    // private
    alignAndShow : function() {
        var me = this;
        me.setAlignment();

        if (me.showAgain) {
            me.show(true);
        }
        me.showAgain = false;
    },

    // private
    setAlignment:  function() {
        var me = this;
        if (! me.el) {
            return;
        }
        switch(me.side) {
            case 'n' :
                me.setWidth(me.win.el.getWidth() - 10);
                Ext.apply(me.alignToParams, {
                    alignTo        : 'tl',
                    alignToXY      :  [5, (me.el.getComputedHeight() * -1) + 5],
                    slideDirection : 'b'
                });
                break;

            case 's' :
                me.setWidth(me.win.el.getWidth() - 10);
                Ext.apply(me.alignToParams, {
                    alignTo        : 'bl',
                    alignToXY      :  [5, (Ext.isIE6)? -2 : -7],
                    slideDirection : 't'
                });
                break;

            case 'e' :
                me.setHeight(me.win.el.getHeight() - 10);
                Ext.apply(me.alignToParams, {
                    alignTo        : 'tr',
                    alignToXY      :  [-5, 5],
                    slideDirection : 'l'
                });
                break;

            case 'w' :
                me.setHeight(me.win.el.getHeight() - 10);
                Ext.apply(me.alignToParams, {
                    alignTo        : 'tl',
                    alignToXY      :  [(me.el.getComputedWidth() * -1) + 5, 5],
                    slideDirection : 'r'
                });
                break;
        }

        if (!me.hidden) {
            me.el.alignTo(me.win.el, me.alignToParams.alignTo, me.alignToParams.alignToXY);

            // Simple fix for IE, where the bwrap doesn't properly resize.
            if (Ext.isIE) {
                me.bwrap.hide();
                me.bwrap.show();
            }
        }

        // force doLayout()
        me.doLayout();
    },
    setZIndex : function() {
        return this.constructor.superclass.setZIndex.call(this, -3);
    }
});

Ext.preg('Ext.plugins.TDGi.WindowDrawer', Ext.plugins.TDGi.WindowDrawer);
