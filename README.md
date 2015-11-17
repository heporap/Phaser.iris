# Phaser.iris
Phaser.js で動作するアイリスイン・アイリスアウトプラグインです。

![スクリーンショット](iris-in_out.gif)

## properties
### x : number
矩形の左上のx位置です。

### y : number
矩形の左上のy位置です。

### width : number
矩形の幅です。

### height : number
矩形の高さです。

### radius : number
円の半径です。

### center : Phaser.Point
円の中心を示します。

x、yをプロパティに持つオブジェクトです。

### busy : boolean
autoPlay実行中を示します。

### maxRadius : number
円が矩形を隠す最小半径です。

### maxRadiusGradient : number
円が矩形を隠す最小半径です。gradientが指定されている場合はoffsetの内側が矩形を隠すように半径を計算します。

## method

### setup(metrics, circle)
- metrics { x:0, y:0, width:this.game.world.width, height:this.game.world.height, img:null, borderWidth:0, borderColor:'rgba(0,0,128,1)', bgColor:'rgba(0,0,0,1)' }
- circle { x:mtrc.width * .5, y:mtrc.height * .5, radius:null, img:null, color:'rgba(255,255,255,1)', offset:0.6, gradient:null, borderWidth:0, borderColor:'rgba(128,128,128,1)' }

初期設定を行います。

metrics.imgとmetrics.bgColorはどちらか一方が使用されます。metrics.imgが優先です。

circle.colorは円の中心を塗りつぶします。circle.gradientが指定されていると、円の中心をcircle.colorとし、円の外側にむけてグラデーションをつけます。
circle.imgと、circle.color、circle.gradientの併用が可能です。

metrics.bgColor、metrics.borderColor、circle.color、circle.borderColorの指定方法はCSSの色に準拠します。rgbaを使用すると透明度の指定も可能です。

metrics.img、circle.imgはpreloadで読み込んだ画像のキーを指定します。
metrics、circleとも、画像サイズと width、heightが異なる場合は、width、heightに合わせて拡大されます。

metrics.borderは矩形の内側に描画します。circle.borderは円の外側に描画します。

### start()
アイリスをステージに登場させ、表示します。

### stop()
アイリスをステージから除去します。
メモリから削除する場合はdestroy()を使用してください。

### autoPlay(fn, thisObject, to, duration, totally, easing)
- fn: コールバック関数
- thisObject: コールバック関数内でthisにマッピングされるオブジェクト
- to: 半径を変更する値。省略時は矩形が隠れる数値、または、すでに画面全体が隠れている場合は0。
- duration: 指定ミリ秒
- totally: trueならdurationは0からmaxRadiusGradientまでかかる時間を示す。falseならdurationの時間でvalueからtoまで変更する。デフォルトはfalse
- easing: 再生時間のeasing。デフォルトはPhaser.Easing.Linear.None

circle.gradientが指定されていてcircle.offsetが0の場合は、circle.offsetを0.1に変更します。

### stopPlay()
再生を止めます。

### inBox(point, inBorder)
- point (Phaser.Point) {x, y}
- inBorder (boolean)

ポイントが枠内にあるか判断します。

inBorderがtrueなら、borderを含め、falseなら含めません。デフォルトはfalseです。

### inCircle(point, inBorder)
- point (Phaser.Point) {x, y}
- inBorder (boolean)

ポイントがアイリスの円内にあるか判断します。

inBorderがtrueなら、borderを含め、falseなら含めません。デフォルトはfalseです。

## sample code

```javascript
	var game = new Phaser.Game(800, 600, Phaser.AUTO, 'gworld');
	
	var gamePlay = {
		preload: function(game){
	
			game.load.image('iris', 'assets/sprite/'+'iris.png');
			game.load.image('iris_bg', 'assets/sprite/'+'iris_bg.jpg');
			
		},
		create: function(game){
			this.iris1 = game.plugins.add(Phaser.Plugin.Iris, this.pluginGroup);
			this.iris1.setup(
				{//metrics
					x: 100, y: 0, width: 400, height: 300, bgColor: 'rgba(0,0,0,0)', borderWidth: 2, borderColor: 'rgba(0,255,255,1)'
				},
				{//circle
					radius: 100, color: 'rgba(0,0,255,0)', img:'iris', gradient: 'rgba(255,0,0,1)', offset:0.3, borderWidth:10
				}).start();
			
			this.iris2 = game.plugins.add(Phaser.Plugin.Iris, this.pluginGroup);
			this.iris2.setup(
				{//metrics
					x: 550, y: 300, width: 200, height: 200, bgColor: 'rgba(255,255,0,1)', borderWidth: 10, borderColor: 'rgba(0,255,255,1)'
				},
				{//circle
					radius:50, color: 'rgba(255,0,255,1)', borderWidth:5, offset:0.1, gradient: 'rgba(255,0,0,1)'
				}).start();

			this.iris3 = game.plugins.add(Phaser.Plugin.Iris, this.pluginGroup);
			this.iris3.setup(
				{//metrics
					x: 400, y: 100, width: 100, height: 250, img: 'iris_bg', borderWidth: 1, borderColor: 'rgba(0,255,255,1)'
				},
				{//circle
					x: 50, y: 50, color: 'rgba(255,0,255,1)', offset:0.1, agradient: 'rgba(255,0,0,1)'
				}).start();
			
		},
		update: function(game){
			
			if( this.iris1.radius !== 400 && !this.iris1.busy ){
				this.iris1.autoPlay(function(){
					console.log('autoPlay finished', this.iris1.radius);
				}, this, 400);
			}
			
		}
	};


	game.state.add('play', gamePlay, true);
```
