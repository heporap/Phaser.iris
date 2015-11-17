/**
* @author       Wataru Kanzaki <dab@wi-wi.jp>
* @copyright    2015 Wicker Wings
* @version      1.0.0
* @license      {@link https://github.com/heporap/Phaser.iris/blob/master/LICENSE.txt|MIT License}
*/
(function(constructor){
	var root = this;
	
	if( define && define.amd ){
		define('gauge', ['Phaser'], constructor);
		
	}else if( root.Phaser ){
		constructor(root.Phaser);
		
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
Iris
****/
Phaser.Plugin.Iris = function(game, parent){
	
	Phaser.Plugin.call(this, game, parent);
	
	this.x = 0;
	this.y = 0;
	this.width = 0;
	this.height = 0;
	
	this.base;
	
	this._callback;
	this._thisObj = null;
	this.busy = false;
	this._autoPlay = false;
	this._easing = null;
	this._passtime = 0;
	this._delay = 0;
	
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
radius
円の半径
****/
Object.defineProperty(Phaser.Plugin.Iris.prototype, 'radius', {
	get: function(){
		return this.circle.radius;
	},
	set: function(val){
		this.circle.radius = val;
		this.draw();
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
		this.draw();
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
			h = Math.max(cy, this.contentWidth - cy);
		
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
		
		if( circle.gradient && !circle.offset ){
			return Infinity;
			
		}else{
			return this.maxRadius / circle.offset;
		}
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
	
	var mtrc = {};
	_extends(mtrc, metrics, {x:0, y:0, width:this.game.world.width, height:this.game.world.height, img:null, borderWidth:0, borderColor:'rgba(0,0,128,1)', bgColor:'rgba(0,0,0,1)'});
	
	var crcl = {};
	_extends(crcl, circle, {x:mtrc.width * .5, y:mtrc.height * .5, radius:null, img:null, color:'rgba(255,255,255,1)', offset:0.6, gradient:null, borderWidth:0, borderColor:'rgba(128,128,128,1)'});
	
	this.x = mtrc.x;
	this.y = mtrc.y;
	this.width = mtrc.width;
	this.height = mtrc.height;
	this.borderWidth = mtrc.borderWidth;
	this.contentWidth = this.width - this.borderWidth * 2;
	this.contentHeight = this.height - this.borderWidth * 2;
	
	if( crcl.radius === null ){
		var cx = crcl.x - this.borderWidth,
			cy = crcl.y - this.borderWidth,
			w = Math.max( cx, this.contentWidth - cx ),
			h = Math.max( cy, this.contentHeight - cy );
		crcl.radius = Math.min(w, h);
	}
	
	this.busy = false;
	
	this.baseImg = mtrc.img;
	
	this.baseBMD = this.game.make.bitmapData(this.width, this.height);
	this.borderColor = mtrc.borderColor;
	this.bgColor = mtrc.bgColor;
	
	this.circle = crcl;
	
	if( this.circle.img ){
		this.circle.img = new Phaser.Image(this.game, 0, 0, this.circle.img);
	}
	
	this.base = new Phaser.Image(this.game, this.x, this.y, this.baseBMD);
	this.base.destroy = (function(iris, oldFunc){
		return function(){
			oldFunc.call(iris.base);
			iris.destroy(true);
		};
	})(this, this.base.destroy);
	this.draw();
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
	var x,y,w,h,b = this.borderWidth;
	if( inBorder ){
		x = this.x;
		y = this.y;
		w = this.width;
		h = this.height;
	}else{
		x = this.x + b;
		y = this.y + b;
		w = this.width - b * 2;
		h = this.height - b * 2;
	}
	return ( x <= point.x && point.x <= x + w && y <= point.y && point.y <= y + h);
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

/****
draw
描画
****/
Phaser.Plugin.Iris.prototype.draw = function(){
	var circle = this.circle, r = circle.radius,
		borderWidth = this.borderWidth;
	
	var i, x = circle.x, y = circle.y, img;
	
	var bmd = this.baseBMD,
		ctx = bmd.context;
	
	ctx.clearRect(0, 0, this.width, this.height);
	
	if( this.borderWidth ){
		ctx.fillStyle = this.borderColor;
		ctx.fillRect(0, 0, this.width, this.height);
		ctx.clearRect(borderWidth, borderWidth, this.contentWidth, this.contentHeight);
	}
	
	if( this.baseImg ){
		bmd.draw(this.baseImg, borderWidth, borderWidth, this.contentWidth, this.contentHeight);
	}else if( this.bgColor ){
		bmd.rect(borderWidth, borderWidth, this.contentWidth, this.contentHeight, this.bgColor);
	}
	
	if( r ){
		var borderWidth = circle.borderWidth;
		if( borderWidth ){
			ctx.save();
			ctx.fillStyle = circle.borderColor;
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
		
		if( circle.img ){
			ctx.save();
			var source = circle.img.texture.baseTexture.source;
			ctx.beginPath();
			ctx.arc(x, y, r, 0, Math.PI * 2, false);
			ctx.clip();
			ctx.drawImage(source, x - r, y - r, r+r, r+r);
			ctx.restore();
			
		}
		if( circle.gradient ){
			var grad = ctx.createRadialGradient(x, y, 0, x, y, r);
			grad.addColorStop(0, circle.color);
			grad.addColorStop(circle.offset, circle.color);
			grad.addColorStop(1, circle.gradient);
			
			ctx.fillStyle = grad;
			ctx.beginPath();
			ctx.arc( x, y, r, 0, Math.PI * 2, false);
			ctx.fill();
			
		}else{
			bmd.circle( x, y, r, circle.color);
			
		}
		
	}
	
	bmd.dirty=true;
};

/****
autoPlay
自動増減アニメーションを行う。

@param fn {function} - callback function。
@param thisObj {any: null} - callback function の中での this オブジェクト。
@param to {number} - toで指定された値までradiusを増減する。
@param duration {number: 3000} - 再生時間。
@param totally {boolean: false} - trueならdurationは0からmaxまでの時間を示し、falseなら現在のvalueから0またはmaxまでの時間を示す。
@return {object} - this。
****/
Phaser.Plugin.Iris.prototype.autoPlay = function(fn, thisObj, to, duration, totally, easing){
	
	if( this.busy || !this.base.parent ){
		return this;
	}
	
	var circle = this.circle;
	var width = this.width,
		height = this.height;
	
	totally = !!totally;
	
	this._thisObj = thisObj || null;
	this._callback = fn;
	
	duration = duration || 3000;
	
	this._easing = easing || Phaser.Easing.Linear.None;
	
	var sv = circle.radius;
	
	if( to === undefined || to === null ) {
		var maxRad = this.maxRadiusGradient;
		to = (sv === maxRad)? 0: maxRad;
		if( to === Infinity && circle.gradient ){
			circle.offset = circle.offset || 0.1;
			to = this.maxRadius / circle.offset;
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
	
	this._passtime = 0;
	this._duration = duration;
	this._startValue = sv;
	this._goalValue = to;
	
	this.busy = true;
	this._autoPlay = true;
	
	return this;
	
};

/****
stopPlay
自動再生を停止する
****/
Phaser.Plugin.Iris.prototype.stopPlay = function(){
	this._autoPlay = false;
	this.busy = false;
};

/****
update
called by system
autoPlay中はアニメーションを行う。
****/
Phaser.Plugin.Iris.prototype.update = function(){
	
	if( this._autoPlay ){
		var duration = this._duration,
			sv = this._startValue,
			gv = this._goalValue,
			val = gv;

		if( duration ){
			var elapsedMS = this.game.time.physicsElapsedMS;
			
			this._passtime += elapsedMS;
			this._passtime = Math.min(this._passtime, duration);
			
			var percent = this._passtime / duration;
			
			percent = this._easing(percent);
			
			val = sv + (gv - sv) * percent;
			
			if( val !== this.circle.radius ){
				this.circle.radius = val;
				this.draw();
			}
		}
		
		if( gv === val ){
			this.busy = false;
			this._autoPlay = false
			
			if( this._callback ){
				this._callback.call(this._thisObj);
			}
		}
		
	}
	
	
};

/******/
return true;
});
