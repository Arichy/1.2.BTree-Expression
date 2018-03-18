class BTNode{//二叉树节点的类(model)
	constructor(data,lchild,rchild){
		this.data = data;
		this.lchild = lchild;
		this.rchild = rchild;
	}
}

class Circle{//二叉树节点的类(view)
	constructor(data,x,y,r,color){
		this.data = data;
		this.x = x;
		this.y = y;
		this.r = r;
		this.color = color;
	}
	render(){
		ctx.beginPath();
		ctx.arc(this.x,this.y,r,0,Math.PI*2);
		ctx.fillStyle = this.color;
		ctx.fill();
		ctx.fillStyle = 'white';//字体颜色
		ctx.textAlign="center";//水平方向居中
		ctx.textBaseline="middle";//垂直方向居中
		ctx.font = '25px sans-serif';//字体大小和字体
		ctx.fillText(this.data,this.x,this.y);
		ctx.closePath();
	}
}

let canvas,width,height,ctx;

let startX,startY,r,delta;

let signColor = 'rgba(70, 153, 232,0.8)';//操作符节点的颜色
let numColor = 'rgba(13,13,13,0.5)';//数字节点的颜色

window.onload = function(){
	//获取canvas DOM
	canvas = document.getElementById('canvas');

	//获取宽，高，上下文
	width = canvas.width;
	height = canvas.height;
	ctx = canvas.getContext('2d');

	//startX,startY为root节点渲染位置，r为每个节点的渲染半径，delta为每个节点的圆心距
	startX = width/2;
	r = 35;
	startY = r+10;
	delta = 80;
};


let BTree = null;
let filteredInput = '';

//将setTimeout Promisify，配合async函数
function setTimeoutPromise(timeout,data){
	return new Promise((resolve,reject)=>{
		setTimeout(()=>{
			try{
				resolve(data);
			} catch(err){
				reject(err);
			}
		},timeout||0);
	});
}

//根据用户输入的后缀表达式生成二叉树
function createBTree(){
	let inputArr = filteredInput.split('|');//通过|分开
	inputArr = inputArr.filter(value=>value.length>0);//过滤掉无效元素，可能是用户多输入了|分隔符
	inputArr = inputArr.map(value=>parseFloat(value) || (value=='0'?0:value));//将输入的运算数转换为数字，并对0特殊处理
	
	let legalArr = ['+','-','*','/','^'];//合法的操作符数组

	let stack = [];//初始化一个栈

	let flag = false;//检测其他错误

	for(let x of inputArr){//遍历输入的元素
		if(typeof x == 'number'){//数字进栈
			stack.push(new BTNode(x,null,null));
		} else{//如果遇到合法符号，退栈两个元素，和符号一起组成二叉树

			if(!legalArr.includes(x)){//如果操作符不合法
				errData.errMsg = '非法字符！';
				errData.errSeen = true;

				return false;
			}

			errData.errMsg = '';
			errData.errSeen = false;

			//退栈两个元素
			let [b,a] = [stack.pop(),stack.pop()];
			if(b===undefined || a==undefined){
				errData.errMsg = '后缀表达式错误！';
				errData.errSeen = true;
				flag = true;
			}

			//生成新的二叉树并入栈
			stack.push(new BTNode(x,a,b));
		}
	}

	if(stack.length>1){//如果剩下的元素多于1，说明输入的错误的后缀表达式
		errData.errMsg = '操作数与操作符数量不匹配！';
		errData.errSeen = true;

		return false;
	}

	if(!flag){//如果没有其他错误
		errData.errMsg = '';
		errData.errSeen = false;

		BTree = stack[0];

		return true;
	}

	return false;	
}

//根据二叉树计算表达式的值
function calBTree(BTNode){
	if(BTNode!=null){
		if(BTNode.lchild!=null){
			switch(BTNode.data){
				case '+':    return calBTree(BTNode.lchild) + calBTree(BTNode.rchild);    break;
				case '-':    return calBTree(BTNode.lchild) - calBTree(BTNode.rchild);    break;
				case '*':    return calBTree(BTNode.lchild) * calBTree(BTNode.rchild);    break;
				case '/':    return calBTree(BTNode.lchild) / calBTree(BTNode.rchild);    break;
				case '^':    return calBTree(BTNode.lchild) ** calBTree(BTNode.rchild);    break;
			}

		} else{
			return BTNode.data;
		}
	} else{
		return 0;
	}
}

//中序遍历生成中缀表达式
function middle(BTree){
	let arr = [];

	return (function f(BTree){
		if(BTree!=null){
			typeof BTree.data !='number' && BTree.data!='^' && arr.push('(');//给除了幂运算之外的所有运算加上括号

			f(BTree.lchild);
			arr.push(BTree.data);
			f(BTree.rchild);

			typeof BTree.data !='number' && BTree.data!='^' && arr.push(')');
		}
		return arr;
	})(BTree);
}

function front(BTree){
	let arr = [];

	return (function f(BTree){
		if(BTree!=null){
			arr.push(BTree.data);
			f(BTree.lchild);
			f(BTree.rchild);
		}
		return arr;
	})(BTree);
}


//提示错误信息的对象
let errData = {
	errMsg:'',
	errSeen:false
};

//创建组件
let error = Vue.extend({
	template:'#error',
	data(){
		return errData;
	}
});
//全局注册组件
Vue.component('error',error);

let vm = new Vue({
	el:'#app',
	data:{
		title:'基本环节第二题：表达式树的建立和遍历',//标题
		input:'',//用户输入
		filteredInput:'',//过滤后的用户输入
		show:true,//canvas是否显示,
		calResult:'',//计算结果，不知道为什么渲染不出来
		middleResult:'',//中缀表达式
		frontResult:''//前缀表达式
	},
	methods:{
		//根据二叉树计算表达式的值
		async cal(){
			console.log('cal被调用');
			
			filteredInput = this.input.replace(/\ /g,'');//去掉输入的所有空格
			
			return await (async ()=>{
				//这里的await，将下面的操作都放到event loop的末尾，这样一定会在window.onload完成后执行下面的操作
				await setTimeoutPromise();

				if(createBTree()){
					//计算结果
					result.innerText = `表达式的计算结果为：${calBTree(BTree)}`;

					//生成中缀表达式
					let middleResult = middle(BTree);
					middleResult = middleResult.slice(Number(!!(middleResult.length-1)),middleResult.length-Number(!!(middleResult.length-1))).join('');
					this.middleResult = middleResult;
				
					//生成前缀表达式
					this.frontResult = front(BTree).join(' | ');

					return true;
				} else{
					document.getElementById('result').innerText = ` 表达式的计算结果为：`;

					return false;
				}
			})();
		},

		//渲染canvas
		async draw(){
			console.log('draw被调用');
			
			if(await this.cal()){
				let circleArr = [];

				//i为调整随着二叉树的增高，下面的孩子节点越来越紧密，否则会重合
				let i=0.4;

				//每次画图之前先清除上一次的画图
				ctx.clearRect(0,0,width,height);

				//开始先序遍历
				(function map(node,x,y){
					if(node!=null){//如果节点不为空
						let circle = new Circle(node.data,x,y,r,typeof node.data=='number'?numColor:signColor);
						i+=0.1;
						circleArr.push(circle);

						//闭包使得每一个元素的两个子节点在x方向的偏移量一致
						(function(j){

							//划线
							if(node.lchild!=null){
								ctx.beginPath();
								ctx.moveTo(x,y);
								ctx.lineTo(circle.x-delta/j,circle.y+delta);
								ctx.stroke();
								ctx.closePath();
							}
							if(node.rchild!=null){
								ctx.beginPath();
								ctx.moveTo(x,y);
								ctx.lineTo(circle.x+delta/j,circle.y+delta);
								ctx.stroke();
								ctx.closePath();
							}

							map(node.lchild,circle.x-delta/j,circle.y+delta);
							map(node.rchild,circle.x+delta/j,circle.y+delta);
						})(i);

					}
				})(BTree,startX,startY,i);//end map
				
				//将数组里的每个节点渲染出来
				for(let circle of circleArr){
					circle.render();
				}

			}
		}//end draw
	}//end methods
});//end vue