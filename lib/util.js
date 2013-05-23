var fs = require('fs'),
	path = require('path'),
	notice = require('./notice.js');

module.exports = {
	'mkdirs': mkdirs,
	'writeFile': writeFile,
	'copyFile': copyFile,
	'getRegExpUnicode': getRegExpUnicode,
	'zeroize': zeroize,
	'getUTCtime': getUTCtime,
	'forEach': forEach,
	'eachObject': eachObject,
	'sortAndStringifyJSON': sortAndStringifyJSON,
	'parsePath': parsePath,
	'createCacheQuery': createCacheQuery,
	'stRunTime': stRunTime
};


function mkdirs(p){
	if (!fs.existsSync(p)) {
		mkdirs(path.join(p, '..'));
		fs.mkdirSync(p);
	}
}

function writeFile(file, buf){
	mkdirs(path.dirname(file));
	fs.writeFileSync(file, buf);
}

function copyFile(from, to){
	writeFile(to, fs.readFileSync(from));
}





function stRunTime(){
	var time = new Date().getTime();
	return function(){
		return new Date().getTime() - time;
	};
}





// 创建带有等待队列的生成函数（附加带有数据缓存）
// isFirstSync：第一次创建数据的时候，是否要执行添加的回调
function createCacheQuery(createDateFunc, isFirstSync){
	var data, query;

	return function(callback, createDataFuncParams){	// createDataFuncParams 一般是不需要的，但考虑到 isFirstSync就有可能传入动态的数据
		if (data !== undefined) {
			callback(false, data);
		} else if (query){
			query.push(callback);
		} else {
			query = [];
			createDateFunc(function(err, rs){
				if (!err) data = rs;

				if (!isFirstSync) callback(err, rs);

				var len = query.length;
				
				if (len) {
					notice.log('Query', len +' has waited');
					var cb;
					while((cb = query.pop())) cb(err, rs);
				}
				query = null;
			}, createDataFuncParams);
		}
	};
}







function getRegExpUnicode(str){
	var rs = '', code;
	for (var i = 0, num = str.length; i < num; i++) {
		// console.log(str.charCodeAt(i).toString(16));
		code = str.charCodeAt(i).toString(16);
		code = zeroize(code, 4);

		rs += '\\u' + code;
	}
	return rs;
}

function zeroize(value, length) {
	if (!length) return value;

	value = String(value);		// 必须转化为字符串才行
	for (var i = (length - value.length), zeros = ''; i > 0; i--) {
		zeros += '0';
	}
	return zeros + value;
}



function getUTCtime(){
	return new Date().toUTCString();
}


function forEach(arr, callback) {
	for (var i = 0, num = arr.length; i < num; i++) {
		if (callback.call(arr[i], i, arr[i], num) === false) break;
	}
}

function eachObject(obj, callback) {
	for (var i in obj) {
		if (callback.call(obj[i], i, obj[i]) === false) break;
	}
}


function sortAndStringifyJSON(json) {
	var arr = [],
		str = [];
	for (var i in json) {
		arr.push(i);
	}
	arr.sort();

	forEach(arr, function(){
		str.push(this + '=' +json[this]);
	});

	return str.join('&');
}

function parsePath(str) {
	return path.normalize(str).toLowerCase();
}