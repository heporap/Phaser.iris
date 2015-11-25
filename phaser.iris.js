/**
* @author       Wataru Kanzaki <dab@wi-wi.jp>
* @copyright    2015 Wicker Wings
* @version      2.3
* @license      {@link https://github.com/heporap/Phaser.iris/blob/master/LICENSE.txt|MIT License}
*/
(function(constructor){
	var root = this;
	
	if( typeof define !== 'undefined' && define.amd ){
		define('iris', ['Phaser'], constructor);
		
	}else if( root.Phaser ){
		constructor(root.Phaser);
		
	}else{
	}
	
}).call(this, function(Phaser){
"use strict";

var _extends = function(dest, src, defaultValues){
	if( typeof defaultValues !== 'undefined' ){
		for( var key in defaultValues ){
			if( defaultValues.hasOwnProperty(key) ){
				dest[key] = ( src && typeof src[key] !== 'undefined' )? src[key]: defaultValues[key];
			}
		}
	}else if(src){
		for( var key in src ){
			if( src.hasOwnProperty(key) ){
				dest[key] = src[key];
			}
		}
	}
};

/****
_splitColor
rgba、16進の色番号を配列に分解する
@param rbga {string} - 'rgba(r, g, b, a)', '#rrggbb'
@return {object} - {r: number, g: number, b: number, a: number}
****/
var _splitColor = function(rgba){
	var result = false, matches;
	if( typeof rgba === 'string' ){
		if( rgba[0] === '#' ){
			var matches = rgba.match(/#(..)(..)(..)/);
			if( matches ){
				result = {};
				result.r = parseInt(matches[1], 16);
				result.g = parseInt(matches[2], 16);
				result.b = parseInt(matches[3], 16);
				result.a = 1;
			}
			
		}else if( (matches = rgba.match(/\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,?\s*([\d.]*)\s*\)/) ) !== null){
			result = {};
			result.r = parseInt(matches[1], 10);
			result.g = parseInt(matches[2], 10);
			result.b = parseInt(matches[3], 10);
			result.a = (matches[4]!==undefined && matches[4]!=='')?parseFloat(matches[4], 10):1;
		}
	}
	return result;
}

/****
_jointColor
rgba色指定に変換する
@param c {object} - {r: number, g: number, b: number, a: number}
@return {string} - 'rgba(r,g,b,a)'
****/
var _jointColor = function(c){
	return 'rgba('+c.r+','+c.g+','+c.b+','+c.a+')';
}

/*******/
var TweenData = function(parent, fn, thisObj, properties, duration, ease, delay, repeat, yoyo){
	this.parent = parent; // Iris
	
	this.vStart = {};
	this.vEnd = {};
	this.vKey = {};
	this.delay = delay || 0;
	this.yoyo = !!yoyo;
	this.yoyoStatus = false;
	this.repeat = ( repeat !== undefined )? repeat: this.yoyo? 1: 0;
	this.passtime = 0;
	this.duration = duration || 3000;
	this.easing = ease || Phaser.Easing.Default;
	
	this._thisObj = thisObj || null;
	this._callback = fn;
	
	var poses = {
		'circle': ['offset','radius','x','y','borderWidth','color','gradient','borderColor'],
		'box': ['bgBorderWidth','bgColor','bgBorderColor']
	}
	
	for( var id in properties ){
		for( var type in poses ){
			if( poses[type].indexOf(id) !== -1 ){
				var name = id.replace(/^bgB/,'b');
				var colors = parent[type].prop[name];
				this.vStart[id] = _splitColor(colors) || colors;
				this.vEnd[id] = _splitColor(properties[id]) || properties[id];
				this.vKey[id] = type;
			}
		}
	}
	
};

/****/
TweenData.prototype = {
	/****/
	destroy: function(){
		this.parent = null;
		this.easing = null;
		
	},
	/****/
	run: function(elapsedMS){
		
		var data = this;
		var duration = data.duration;
		
		var parent = this.parent;
		
		data.passtime += elapsedMS;
		data.passtime = Math.min(data.passtime, duration);
		
		var percent = ( duration )? data.passtime / duration: 1;
		percent = data.easing(percent);
		
		if( this.yoyoStatus ){
			percent = 1 - percent;
		}
		
		for( var prop in data.vKey ){
			var vS = data.vStart[prop],
				vE = data.vEnd[prop],
				vK = data.vKey[prop];
			var c = {};
			prop = prop.replace(/^bgB/,'b');
			if( typeof vS === 'number' ){
				parent[vK].prop[prop] = vS + (vE - vS) * percent;
				
			}else{
				for( var i in vS ){//r, g, b, a
					c[i] = vS[i] + (vE[i] - vS[i]) * percent;
					if( i !== 'a' ){
						c[i] = Math.floor(c[i]);
					}
				}
				parent[vK].prop[prop] = _jointColor(c);
				
			}
		}
		
		if( percent === 1 || this.yoyo && percent === 0){
			
			if( this.repeat === 0 ){
				if( this._callback ){
					this._callback.call(this._thisObj, this.repeat);
				}
				return true;
			}else{
				this.passtime = 0;
				if( this.yoyo ){
					this.yoyoStatus = !this.yoyoStatus;
				}
				if( 0 < this.repeat ){
					this.repeat--;
				}
			}
		}
		
		return false;
	}
	
};

/****/
var IrisBox = function(parent, ctx, properties){
	
	var prop = {};
	_extends(prop, properties, {x:0, y:0, width:parent.width, height:parent.height, img:null, borderWidth:0, borderColor:'rgba(0,0,128,1)', bgColor:'rgba(0,0,0,1)'});
	
	this.prop = prop;
	
	Phaser.Rectangle.call(this, prop.x, prop.y, prop.width, prop.height);
	
	this.parent = parent;
	this.ctx = ctx;
	
	if( prop.img ){
		this.img = new Phaser.Image(this.parent.game, 0, 0, prop.img);
	}
	
}

/****/
IrisBox.prototype = Object.create(Phaser.Rectangle.prototype);
IrisBox.prototype.constructor = IrisBox;

/****
right
矩形の右側
****/
Object.defineProperty(IrisBox.prototype, 'right', {
	get: function(){
		return this.box.x + this.box.width;
	},
	set: function(val){
		this.box.x = val - this.box.width;
	}
});

/****
bottom
矩形の下側
****/
Object.defineProperty(IrisBox.prototype, 'bottom', {
	get: function(){
		return this.prop.y + this.prop.height;
	},
	set: function(val){
		this.prop.y = val - this.prop.height;
	}
});
/****
contentWidth
コンテンツ幅
****/
Object.defineProperty(IrisBox.prototype, 'contentWidth', {
	get: function(){
		return this.width - this.prop.borderWidth * 2;
	}
});
/****
contentHeight
コンテンツ高さ
****/
Object.defineProperty(IrisBox.prototype, 'contentHeight', {
	get: function(){
		return this.height - this.prop.borderWidth * 2;
	}
});


/****/
IrisBox.prototype.updateSize = function(){
	this.width = this.parent.width;
	this.height = this.parent.height;
	
};

/****/
IrisBox.prototype.draw = function(){
	var prop = this.prop, 
		borderWidth = prop.borderWidth;
	
	var ctx = this.ctx;
	
	if( borderWidth ){
		ctx.fillStyle = prop.borderColor;
		ctx.fillRect(0, 0, this.width, this.height);
		ctx.clearRect(borderWidth, borderWidth, this.contentWidth, this.contentHeight);
	}else{
		ctx.clearRect(0, 0, this.width, this.height);
	}
	
	if( this.img ){
		var source = this.img.texture.baseTexture.source;
		ctx.drawImage(source, borderWidth, borderWidth, this.contentWidth, this.contentHeight);
	}else if( prop.bgColor ){
		ctx.fillStyle = prop.bgColor;
		ctx.fillRect(borderWidth, borderWidth, this.contentWidth, this.contentHeight, prop.bgColor);
	}
	
};


/****/
var IrisCircle = function(parent, ctx, properties){
	
	var prop = {};
	_extends(prop, properties, {x:parent.width * .5, y:parent.height * .5, radius:null, img:null, color:(properties.img)? null: 'rgba(255,255,255,1)', offset:0.6, gradient:null, borderWidth:0, borderColor:'rgba(128,128,128,1)'});
	
	if( prop.gradient && !prop.color ){
		throw 'IrisCircle: need color while gradient is set';
	}
	
	if( prop.radius === null ){
		var cx = prop.x - parent.borderWidth,
			cy = prop.y - parent.borderWidth,
			w = Math.max( cx, parent.contentWidth - cx ),
			h = Math.max( cy, parent.contentHeight - cy );
		prop.radius = Math.min(w, h);
	}
	
	this.prop = prop;
	
	this.parent = parent;
	Phaser.Circle.call(this, prop.x, prop.y, prop.radius * 2);
	
	this.ctx = ctx;
	
	if( this.prop.img ){
		this.img = new Phaser.Image(this.parent.game, 0, 0, this.prop.img);
	}
	
}

/****/
IrisCircle.prototype = Object.create(Phaser.Circle.prototype);
IrisCircle.prototype.constructor = IrisCircle;

/****
radius
円の半径
****/
Object.defineProperty(IrisCircle.prototype, 'radius', {
	get: function(){
		return this.prop.radius;
	},
	set: function(val){
		this.prop.radius = val;
		this.parent.dirty = true;
	}
});

/****
center
円の中心
****/
Object.defineProperty(IrisCircle.prototype, 'center', {
	get: function(){
		return {x:this.prop.x,y:this.prop.y};
	},
	set: function(p){
		this.prop.x = p.x;
		this.prop.y = p.y;
		this.parent.dirty = true;
	}
});

/****
center
円の中心
****/
Object.defineProperty(IrisCircle.prototype, 'y', {
	get: function(){
		return this.prop.y;
	},
	set: function(y){
		this.prop.y = y;
		this.parent.dirty = true;
	}
});

/****
center
円の中心
****/
Object.defineProperty(IrisCircle.prototype, 'x', {
	get: function(){
		return this.prop.x;
	},
	set: function(x){
		this.prop.x = x;
		this.parent.dirty = true;
	}
});



/****/
IrisCircle.prototype.draw = function(){
	var r = this.radius,
		ctx = this.ctx,
		x = this.x,
		y = this.y;
		
	if( this.radius ){
		var borderWidth = this.prop.borderWidth;
		if( borderWidth ){
			ctx.save();
			ctx.fillStyle = this.prop.borderColor;
			ctx.beginPath();
			ctx.arc( x, y, r + borderWidth, 0, Math.PI * 2, false);
			ctx.clip();
			ctx.clearRect(x - r - borderWidth, y - r - borderWidth, (r + borderWidth)*2, (r + borderWidth)*2);
			ctx.fill();
		}
		
		ctx.beginPath();
		ctx.arc( x, y, r, 0, Math.PI * 2, false);
		ctx.clip();
		ctx.clearRect(x - r, y - r, r + r, r + r);
		ctx.restore();
		
		if( this.img ){
			ctx.save();
			var source = this.img.texture.baseTexture.source;
			ctx.beginPath();
			ctx.arc(x, y, r, 0, Math.PI * 2, false);
			ctx.clip();
			ctx.drawImage(source, x - r, y - r, r+r, r+r);
			ctx.restore();
			
		}
		if( this.prop.gradient && this.prop.color){
			var grad = ctx.createRadialGradient(x, y, 0, x, y, r);
			grad.addColorStop(0, this.prop.color);
			grad.addColorStop(this.prop.offset, this.prop.color);
			grad.addColorStop(1, this.prop.gradient);
			
			ctx.fillStyle = grad;
			ctx.beginPath();
			ctx.arc( x, y, r, 0, Math.PI * 2, false);
			ctx.fill();
			
		}else if( this.prop.color ){
			ctx.fillStyle = this.prop.color;
			ctx.beginPath();
			ctx.arc( x, y, r, 0, Math.PI * 2, false);
			ctx.fill();
			
		}
		
	}

};

/****
Iris
****/
Phaser.Plugin.Iris = function(game, parent){
	
	Phaser.Plugin.call(this, game, parent);
	
	this.base;
	this.circle;
	this.box;
	
	this._tweenDataes = [];
	
};
Phaser.Plugin.Iris.prototype = Object.create(Phaser.Plugin.prototype);
Phaser.Plugin.Iris.prototype.constructor = Phaser.Plugin.Iris;

/****
init
called by system
****/
Phaser.Plugin.Iris.prototype.init = function(world){
	this.world = world || this.game.world;
};

/****
x
矩形の左側
****/
Object.defineProperty(Phaser.Plugin.Iris.prototype, 'x', {
	get: function(){
		return this.base.x;
	},
	set: function(val){
		this.base.x = val;
	}
});

/****
x
矩形の左側
****/
Object.defineProperty(Phaser.Plugin.Iris.prototype, 'y', {
	get: function(){
		return this.base.y;
	},
	set: function(val){
		this.base.y = val;
	}
});

/****
width
矩形の幅
****/
Object.defineProperty(Phaser.Plugin.Iris.prototype, 'width', {
	get: function(){
		return this._width;
	},
	set: function(val){
		this._width = val;
		this.baseBMD.resize(val, this.baseBMD.height);
		this.base.width = val;
		this.box.updateSize();
		this.dirty = true;
	}
});

/****
height
矩形の高さ
****/
Object.defineProperty(Phaser.Plugin.Iris.prototype, 'height', {
	get: function(){
		return this._height;
	},
	set: function(val){
		this._height = val;
		this.baseBMD.resize(this.baseBMD.width, val);
		this.base.height = val;
		this.box.updateSize();
		this.dirty = true;
	}
});

/****
right
矩形の右側
****/
Object.defineProperty(Phaser.Plugin.Iris.prototype, 'right', {
	get: function(){
		return this.x + this.width;
	},
	set: function(val){
		this.x = val - this.width;
	}
});

/****
bottom
矩形の下側
****/
Object.defineProperty(Phaser.Plugin.Iris.prototype, 'bottom', {
	get: function(){
		return this.y + this.height;
	},
	set: function(val){
		this.y = val - this.height;
	}
});

/****
radius
円の半径
****/
Object.defineProperty(Phaser.Plugin.Iris.prototype, 'radius', {
	get: function(){
		return this.circle.radius;
	},
	set: function(val){
		this.circle.radius = val;
		this.dirty = true;
	}
});

/****
center
円の中心
****/
Object.defineProperty(Phaser.Plugin.Iris.prototype, 'center', {
	get: function(){
		return {x:this.circle.x,y:this.circle.y};
	},
	set: function(p){
		this.circle.x = p.x;
		this.circle.y = p.y;
		this.dirty = true;
	}
});

/****
contentWidth
矩形のborderを除いた幅
****/
Object.defineProperty(Phaser.Plugin.Iris.prototype, 'contentWidth', {
	get: function(){
		return this.box.contentWidth;
	}
});

/****
contentHeight
矩形のborderを除いた高さ
****/
Object.defineProperty(Phaser.Plugin.Iris.prototype, 'contentHeight', {
	get: function(){
		return this.box.contentHeight;
	}
});

/****
borderWidth
矩形のborder幅
****/
Object.defineProperty(Phaser.Plugin.Iris.prototype, 'borderWidth', {
	get: function(){
		return this.box.prop.borderWidth;
	}
});

/****
maxRadius
矩形を隠す最小半径
****/
Object.defineProperty(Phaser.Plugin.Iris.prototype, 'maxRadius', {
	get: function(){
		var circle = this.circle,
			cx = circle.x - this.borderWidth,
			cy = circle.y - this.borderWidth,
			w = Math.max(cx, this.contentWidth - cx),
			h = Math.max(cy, this.contentHeight - cy);
		
		return Math.sqrt(w * w + h * h);
	}
});

/****
maxRadius
グラデーション領域の終了位置（offset）が矩形を隠す最小半径
グラデーションのoffsetが0の場合はInfinityを返す
****/
Object.defineProperty(Phaser.Plugin.Iris.prototype, 'maxRadiusGradient', {
	get: function(){
		var circle = this.circle;
		
		if( circle.gradient && !circle.prop.offset ){
			return Infinity;
			
		}else{
			return this.maxRadius / circle.prop.offset;
		}
	}
});

/****
busy
tween実行中
****/
Object.defineProperty(Phaser.Plugin.Iris.prototype, 'busy', {
	get: function(){
		return (this._autoPlay || ((this._tween)?this._tween.isRunning: false));
	}
});


/****
Phaser.Plugin.Iris.prototype.setup
metrics.imgとmetrics.bgColorはどちらか一方が使用される。imgを優先。
circle.imgと、circle.colorまたはcircle.gradientの併用が可能。circle.colorはcirle.imgを塗りつぶす。
circle.gradientが指定されていると、円の中心をcircle.colorとし、円の外側にむけてグラデーションをつける。
metrics.bgColor、metrics.borderColor、circle.color、circle.borderColorの指定方法はCSSの色に準拠する。

@param metrics {object} - x:0, y:0, width:this.game.world.width, height:this.game.world.height, img:null, borderWidth:0, borderColor:'rgba(0,0,128,1)', bgColor:'rgba(0,0,0,1)'
@param circle {object} - x:mtrc.width * .5, y:mtrc.height * .5, radius:null, img:null, color:'rgba(255,255,255,1)', offset:0.6, gradient:null, borderWidth:0, borderColor:'rgba(128,128,128,1)'
@return this
****/
Phaser.Plugin.Iris.prototype.setup = function(metrics, circle){
	
	var prop = {};
	_extends(prop, metrics, {x:0, y:0, width:this.game.world.width, height:this.game.world.height});
	
	this._width = prop.width;
	this._height = prop.height;
	
	this.baseBMD = this.game.make.bitmapData(prop.width, prop.height);
	
	this.box = new IrisBox(this, this.baseBMD.context, metrics);
	this.circle = new IrisCircle(this, this.baseBMD.context, circle);
	
	this.base = new Phaser.Image(this.game, prop.x, prop.y, this.baseBMD);
	this.base.destroy = (function(iris, oldFunc){
		return function(){
			oldFunc.call(iris.base);
			oldFunc = null;
			iris.destroy(true);
		};
	})(this, this.base.destroy);
	
	this.game.add.image(this.base);
	
	return this;
	
};

/****
start
画像を表示する
****/
Phaser.Plugin.Iris.prototype.start = function(){
	this.world.addChild(this.base);
};

/****
stop
画像を非表示にする
****/
Phaser.Plugin.Iris.prototype.stop = function(){
	this.world.removeChild(this.base);
};

/****
bringToTop
画像を一番上に移動させる
****/
Phaser.Plugin.Iris.prototype.bringToTop = function(){
	this.world.bringToTop(this.base);
};

/****
sendToBack
画像を一番下に移動させる
****/
Phaser.Plugin.Iris.prototype.sendToBack = function(){
	this.world.sendToBack(this.base);
};

/****
inBox
pointがthis.width、this.height内に内包しているかを求める
@param point {Phaser.Point} - {x, y}
@param inBorder {boolean: false} - borderを含めるかどうか
@return {boolean} - trueなら内包する
****/
Phaser.Plugin.Iris.prototype.inBox = function(point, inBorder){
	var x, y, w, h, b = this.borderWidth;
	if( inBorder ){
		x = this.x;
		y = this.y;
		w = this.width;
		h = this.height;
	}else{
		x = this.x + b;
		y = this.y + b;
		w = this.contentWidth;
		h = this.contentHeight;
	}
	return ( x <= point.x && point.x <= x + w && y <= point.y && point.y <= y + h );
};

/****
inCircle
pointがcircleに内包しているかを求める
@param point {Phaser.Point} - {x, y}
@param inBorder {boolean: false} - borderを含めるかどうか
@return {boolean} - trueなら内包する
****/
Phaser.Plugin.Iris.prototype.inCircle = function(point, inBorder){
	var x,y,r;
	if( !this.inBox(point, true) ){
		return false;
	}
	x = this.x + this.center.x - point.x,
	y = this.y + this.center.y - point.y,
	r = ( inBorder )? this.radius + this.circle.borderWidth: this.radius;
	return ( x * x + y * y <= r * r );
};


/****
destroy
オブジェクトの削除
****/
Phaser.Plugin.Iris.prototype.destroy = function(){
	if( this.base.parent ){
		this.base.destroy();
	}
	
	this.stopPlay();
	
	var i = this._tweenDataes.length;
	while( i-- ){
		this._tweenDataes[i].destroy();
	}
	this._tweenDataes.length = 0;
	
	this.circle = null;
	
	this.baseBMD = null;
	this._callback = null;
	this._thisObj = null;
	this._easing = null;
	this.base = null;
	this.parent = null;
	this.world = null;
	this.game = null;
	
};

/***
calcurate
autoPlayの再計算を行う
***/
Phaser.Plugin.Iris.prototype.calcurate = function(){
	var elapsedMS = this.game.time.physicsElapsedMS;
	var i = this._tweenDataes.length;
	while( i-- ){
		if( this._tweenDataes[i].run(elapsedMS) ){
			this._tweenDataes.splice(i, 1)[0].destroy();
		}
	}
	
	this._autoPlay = !!this._tweenDataes.length;
	
	this.dirty = true;
	
};

/****
tween
自動増減アニメーションを行う。

@param to {object} - {x, y, radius, color, gradient, offset, borderWidth, borderColor} circleのプロパティ
@param fn {function} - callback function。
@param thisObj {any: null} - callback function の中での this オブジェクト。
@param duration {number: 3000} - 再生時間。
@param totally {boolean: false} - trueならdurationは0からmaxまでの時間を示し、falseなら現在のvalueから0またはmaxまでの時間を示す。
@param easing {function: Phaser.Easing.Linear.None} - イージング関数
@return {object} - this。
****/
Phaser.Plugin.Iris.prototype.autoPlay = function(fn, thisObj, properties, duration, ease, delay, repeat, yoyo){
	
	this._tweenDataes.push( new TweenData(this, fn, thisObj, properties, duration, ease, delay, repeat, yoyo) );
	this._autoPlay = true;
	return this._tweenDataes[this._tweenDataes.length - 1];
	
};

/****
tween
radius自動増減アニメーションを行う。

@param fn {function} - callback function。
@param thisObj {any: null} - callback function の中での this オブジェクト。
@param to {number} - toで指定された値までradiusを増減する。
@param duration {number: 3000} - 再生時間。
@param totally {boolean: false} - trueならdurationは0からmaxまでの時間を示し、falseなら現在のvalueから0またはmaxまでの時間を示す。
@param easing {function: Phaser.Easing.Linear.None} - イージング関数
@return {object} - this。
****/
Phaser.Plugin.Iris.prototype.tween = function(fn, thisObj, to, duration, totally, easing){
	
	if( this.busy || !this.base.parent ){
		return this;
	}
	
	var circle = this.circle;
	var width = this.width,
		height = this.height;
	
	totally = !!totally;
	
	duration = duration || 3000;
	
	easing = easing || Phaser.Easing.Linear.None;
	
	var sv = circle.radius;
	
	var maxRad = this.maxRadiusGradient;
	if( to === undefined || to === null ) {
		to = (sv === maxRad)? 0: maxRad;
		if( to === Infinity && circle.gradient ){
			circle.prop.offset = circle.prop.offset || 0.1;
			to = this.maxRadius / circle.prop.offset;
		}
		
	}else{
		to = (to < 0)? 0: +to;
	}
	
	if( totally ){
		if( to < sv ){
			duration = duration * (sv / maxRad);
			duration -= duration * (to / maxRad);
		}else{
			duration = duration * ((maxRad - sv) / maxRad);
			duration -= duration * ((maxRad - to) / maxRad);
		}
	}
	
	this._tween = this.game.add.tween(this.circle).to({radius:to}, duration, easing, true, 0, 0, false);
	if( fn ){
		this._tween.onComplete.add(fn, thisObj);
	}
	
	return this;
	
};

/****
stopPlay
自動再生を停止する
****/
Phaser.Plugin.Iris.prototype.stopPlay = function(tweenObj){
	if( tweenObj !== undefined ){
		var n = this._tweenDataes.indexOf( tweenObj );
		if( n !== -1 ){
			this._tweenDataes.splice(n, 1)[0].destroy();
			this._autoPlay = !!this._tweenDataes.length;
		}
	}else if( this._tween && this._tween.isRunning ){
		this._tween.stop();
	}
	this._autoPlay = false;
};

/****
update
called by system
autoPlay中はアニメーションを行う。
****/
Phaser.Plugin.Iris.prototype.update = function(){
	if( this._autoPlay ){
		this.calcurate();
	}
	
	if( this.dirty ){
		this.box.draw();
		this.circle.draw();
		
		this.baseBMD.dirty = true;
		this.dirty = false;
	}
};

/******/
return true;
});
