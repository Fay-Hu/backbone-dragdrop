
(function(root, View, DragDrop, Drag, Drop, Poly){
	
	var View = View(),
		Poly = Poly(),
		Drag = Drag({View: View}), 
		Drop = Drop({View: View}),
		DragDrop = root.DragDrop = DragDrop({View: View, Drag: Drag, Drop: Drop, Poly: Poly});
		
		//Poly.forceShim = true;
		
		//Poly.init({el:$('#dragme')[0]});

})(this, function(){ // View
	/**
	* @extends Backbone.View
	* @return View
	*/
	var View = Backbone.View,
		proto = View.prototype;
		
	return View.extend({
		initialize: function(options){
			options || (options = {});
			proto.initialize.apply(this, arguments)
			_.extend(this, options);
			this.template || (this.template = '');
			this.model  || (this.model = new Backbone.Model());
		},
		render: function(){
			this.$el.html(_.template(this.template)(this.model.toJSON()));
			this.delegateEvents();
			return this;
		},
		close: function(){
			this.$el.unbind();
			this.undelegateEvents();
			this.$el.remove();
		}
	});
	
	// End View
	
}, function(use){ // DragDrop
	/**
	*
	* @extends View
	* @return DragDrop
	*/
	use || (use = {});
	var View = use.View,
		template = use.template || '',
		proto = View.prototype,
		dragProto = use.Drag.prototype,
		dropProto = use.Drop.prototype,
		DragDrop;
		
	return DragDrop = View.extend(_.extend(
		{},
		dragProto,
		dropProto,
		{
			initialize: function(){
				proto.initialize.apply(this, arguments);
			},
			events: _.extend({}, dragProto.events, dropProto.events)
		}
	), {
		View: View,
		Drag: use.Drag,
		Drop: use.Drop,
		Poly: use.Poly
	});
	
	
},function(use){ // DragDrop.Drag
	/**
	*
	* @extends View
	* @return Drag
	*/
	use || (use = {});
	var View = use.View,
		proto = View.prototype,
		Drag;
		
	return Drag = View.extend({
		attributes: {
			'draggable': 'true'
		},
		initialize: function(){
			proto.initialize.apply(this, arguments);
		},
		events: {
			'dragstart.dragdrop': 'dragStart',
			'selectstart.dragdrop': 'selectStart'
		},
		dragStart: function(event){
			event || (event = window.event);
			var dt = this.dt = event.originalEvent.dataTransfer;
			dt.effectAllowed = 'copy';
			dt.setData('Text', 'Sample Data');
		},
		selectStart: function(event){
			event || (event = window.event);
			this.el.dragDrop && this.el.dragDrop();
		}
	});
	
	// End DragDrop.Drag
	
}, function(use){ // DragDrop.Drop
	/**
	*
	* @extends View
	* @return Drop
	**/
	use || (use = {});
	var View = use.View,
		proto = View.prototype,
		Drop;
		
	return Drop = View.extend({
		initialize: function(){
			proto.initialize.apply(this, arguments);
		},
		events: {
			'dragover.dragdrop':'dragOver',
			'dragenter.dragdrop': 'dragEnter',
			'drop.dragdrop': 'dragDrop'
		},
		dragOver: function(event){
			event || (event = window.event);
			event.preventDefault();
			return false;
		},
		dragEnter: function(event){
			event || (event = window.event);
			event.preventDefault();
			return false;
		},
		dragDrop: function(event){
			event || (event = window.event);
			event.preventDefault();
			event.stopPropagation();
			this.dt = event.originalEvent.dataTransfer;
			return false;
		}
	});	
	
	// End DragDrop.Drop
	
}, function(){
	/**
	*
	* @return Poly
	*/
	
	return (function(){
		var startX, startY, dragEvent, originalObject, draggedObject, initialMouseX, initialMouseY;
		return {
			forceShim: false,
			init: function(options){
				var div	= document.createElement('div');
				if ( ! this.forceShim || ! (('draggable' in div) || ('ondragstart' in div && 'ondrop' in div)) ) {
					return;
				}
				options || (options = {});
				this.options = options;
				this.el = options.el || '';
				this.bindEvents();
			},
			bindEvents: function(){
				if(!this.el){
					return;
				}
				console.log(this.el);
				$(this.el).on('mousedown.dragdrop', _.bind(this.mouseDown, this));
			},
			mouseDown: function(event){
				event || (event = window.event);
				this.capture(event.target, event);
				this.setPosition(0, 0);
				initialMouseX = event.clientX;
				initialMouseY = event.clientY;
				var el = document.documentElement || document.body;
				$(el).on('mousemove.dragdrop', _.bind(this.mouseMove, this));
				$(el).on('mouseup.dragdrop', _.bind(this.mouseUp, this));
				return false;
			},
			mouseMove: function(event){
				event || (event = window.event);
				event.preventDefault();
				if(draggedObject){
					var dX = event.clientX - initialMouseX,
						dY = event.clientY - initialMouseY;
					this.setPosition(dX, dY);
				}
				return false;
			},
			mouseUp: function(event){
				event || (event = window.event);
				event.preventDefault();
				this.release();
				var el = document.documentElement || document.body;
				$(el).off('mousemove.dragdrop');
				$(el).off('mouseup.dragdrop');
				return false;
			},
			setPosition: function(x, y){
				draggedObject.style.left = startX + x + 'px';
				draggedObject.style.top = startY = y + 'px';
			},
			release: function(){ console.log('poly.release');
				if(typeof draggedObject === 'undefined'){
					return;
				}
				var e;
				e = this.createEvent('dragend');
				e.dataTransfer = dragEvent.dataTransfer;
				e.target = dragEvent.target;
				this.trigger(originalObject, e);
				var effectAllowed = e.dataTransfer.effectAllowed.toLowerCase();
				console.log('effectAllowed', effectAllowed);
				if(effectAllowed === 'move'){
					draggedObject.style.position = draggedObject.style.left = draggedObject.style.top = '';
				} else {
					if(draggedObject.parentNode){
						draggedObject.parentNode.removeChild(draggedObject);
					}
				}
				originalObject = draggedObject = dragEvent = null;
			},
			capture: function(obj, event){ console.log('poly.capture');
				var e = dragEvent = this.createEvent('dragstart'), effectAllowed = '';
				e.dataTransfer = this.dataTransfer();
				e.target = event.target;
				this.trigger(obj, e);
				startX = obj.offsetLeft;
				startY = obj.offsetTop;
				originalObject = obj;
				effectAllowed = e.dataTransfer.effectAllowed.toLowerCase();
				if(effectAllowed == 'move'){
					draggedObject = obj;
				} else {
					draggedObject = obj.cloneNode(true);
					(document.documentElement || document.body).appendChild(draggedObject);
				}
				
				draggedObject.style.position = 'absolute';
				draggedObject.style.left = obj.offsetLeft;
				draggedObject.style.left = obj.offsetTop;
				return this;
			},
			trigger: function(el, e){
				if(el.dispatchEvent){
					el.dispatchEvent(e);
				} else {
					el.fireEvent(e.eventType, e)
				}
				return this;
			},
			createEvent: function(name){
				var e;
				name = name.toLowerCase();
				if(document.createEvent){
					e = document.createEvent('HTMLEvents');
					e.initEvent(name, true, true);
				} else {
					e = document.createEventObject();
					e.eventType = 'on' + name;
				}
				
				return e;
			},
			dataTransfer: function(){
				return (function(){
					var items = {};
					
					function getFormat(format){
						format = format.toLowerCase();
						if(format === 'text'){
							format = 'text/plain';
						}
						if(format === 'url'){
							format = 'text/url-list';
						}
						return format;
					}
					
					return {
						dropEffect: 'copy',
						effectAllowed: 'copy',
						getData: function(format){
							return items[getFormat(format)];
						},
						setData: function(format, value){
							items[getFormat(format)] = value;
						},
						clearData: function(){
							if(typeof format === 'undefined'){
								items = {};
								return
							}
							delete items[getFormat(format)];
						}
					};
				})();
			}
		};
	}());
});