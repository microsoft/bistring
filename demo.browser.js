(function () {
	'use strict';

	var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var O = 'object';
	var check = function (it) {
	  return it && it.Math == Math && it;
	};

	// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
	var global_1 =
	  // eslint-disable-next-line no-undef
	  check(typeof globalThis == O && globalThis) ||
	  check(typeof window == O && window) ||
	  check(typeof self == O && self) ||
	  check(typeof commonjsGlobal == O && commonjsGlobal) ||
	  // eslint-disable-next-line no-new-func
	  Function('return this')();

	var fails = function (exec) {
	  try {
	    return !!exec();
	  } catch (error) {
	    return true;
	  }
	};

	// Thank's IE8 for his funny defineProperty
	var descriptors = !fails(function () {
	  return Object.defineProperty({}, 'a', { get: function () { return 7; } }).a != 7;
	});

	var nativePropertyIsEnumerable = {}.propertyIsEnumerable;
	var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

	// Nashorn ~ JDK8 bug
	var NASHORN_BUG = getOwnPropertyDescriptor && !nativePropertyIsEnumerable.call({ 1: 2 }, 1);

	// `Object.prototype.propertyIsEnumerable` method implementation
	// https://tc39.github.io/ecma262/#sec-object.prototype.propertyisenumerable
	var f = NASHORN_BUG ? function propertyIsEnumerable(V) {
	  var descriptor = getOwnPropertyDescriptor(this, V);
	  return !!descriptor && descriptor.enumerable;
	} : nativePropertyIsEnumerable;

	var objectPropertyIsEnumerable = {
		f: f
	};

	var createPropertyDescriptor = function (bitmap, value) {
	  return {
	    enumerable: !(bitmap & 1),
	    configurable: !(bitmap & 2),
	    writable: !(bitmap & 4),
	    value: value
	  };
	};

	var toString = {}.toString;

	var classofRaw = function (it) {
	  return toString.call(it).slice(8, -1);
	};

	var split = ''.split;

	// fallback for non-array-like ES3 and non-enumerable old V8 strings
	var indexedObject = fails(function () {
	  // throws an error in rhino, see https://github.com/mozilla/rhino/issues/346
	  // eslint-disable-next-line no-prototype-builtins
	  return !Object('z').propertyIsEnumerable(0);
	}) ? function (it) {
	  return classofRaw(it) == 'String' ? split.call(it, '') : Object(it);
	} : Object;

	// `RequireObjectCoercible` abstract operation
	// https://tc39.github.io/ecma262/#sec-requireobjectcoercible
	var requireObjectCoercible = function (it) {
	  if (it == undefined) throw TypeError("Can't call method on " + it);
	  return it;
	};

	// toObject with fallback for non-array-like ES3 strings



	var toIndexedObject = function (it) {
	  return indexedObject(requireObjectCoercible(it));
	};

	var isObject = function (it) {
	  return typeof it === 'object' ? it !== null : typeof it === 'function';
	};

	// `ToPrimitive` abstract operation
	// https://tc39.github.io/ecma262/#sec-toprimitive
	// instead of the ES6 spec version, we didn't implement @@toPrimitive case
	// and the second argument - flag - preferred type is a string
	var toPrimitive = function (input, PREFERRED_STRING) {
	  if (!isObject(input)) return input;
	  var fn, val;
	  if (PREFERRED_STRING && typeof (fn = input.toString) == 'function' && !isObject(val = fn.call(input))) return val;
	  if (typeof (fn = input.valueOf) == 'function' && !isObject(val = fn.call(input))) return val;
	  if (!PREFERRED_STRING && typeof (fn = input.toString) == 'function' && !isObject(val = fn.call(input))) return val;
	  throw TypeError("Can't convert object to primitive value");
	};

	var hasOwnProperty = {}.hasOwnProperty;

	var has = function (it, key) {
	  return hasOwnProperty.call(it, key);
	};

	var document$1 = global_1.document;
	// typeof document.createElement is 'object' in old IE
	var EXISTS = isObject(document$1) && isObject(document$1.createElement);

	var documentCreateElement = function (it) {
	  return EXISTS ? document$1.createElement(it) : {};
	};

	// Thank's IE8 for his funny defineProperty
	var ie8DomDefine = !descriptors && !fails(function () {
	  return Object.defineProperty(documentCreateElement('div'), 'a', {
	    get: function () { return 7; }
	  }).a != 7;
	});

	var nativeGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

	// `Object.getOwnPropertyDescriptor` method
	// https://tc39.github.io/ecma262/#sec-object.getownpropertydescriptor
	var f$1 = descriptors ? nativeGetOwnPropertyDescriptor : function getOwnPropertyDescriptor(O, P) {
	  O = toIndexedObject(O);
	  P = toPrimitive(P, true);
	  if (ie8DomDefine) try {
	    return nativeGetOwnPropertyDescriptor(O, P);
	  } catch (error) { /* empty */ }
	  if (has(O, P)) return createPropertyDescriptor(!objectPropertyIsEnumerable.f.call(O, P), O[P]);
	};

	var objectGetOwnPropertyDescriptor = {
		f: f$1
	};

	var anObject = function (it) {
	  if (!isObject(it)) {
	    throw TypeError(String(it) + ' is not an object');
	  } return it;
	};

	var nativeDefineProperty = Object.defineProperty;

	// `Object.defineProperty` method
	// https://tc39.github.io/ecma262/#sec-object.defineproperty
	var f$2 = descriptors ? nativeDefineProperty : function defineProperty(O, P, Attributes) {
	  anObject(O);
	  P = toPrimitive(P, true);
	  anObject(Attributes);
	  if (ie8DomDefine) try {
	    return nativeDefineProperty(O, P, Attributes);
	  } catch (error) { /* empty */ }
	  if ('get' in Attributes || 'set' in Attributes) throw TypeError('Accessors not supported');
	  if ('value' in Attributes) O[P] = Attributes.value;
	  return O;
	};

	var objectDefineProperty = {
		f: f$2
	};

	var hide = descriptors ? function (object, key, value) {
	  return objectDefineProperty.f(object, key, createPropertyDescriptor(1, value));
	} : function (object, key, value) {
	  object[key] = value;
	  return object;
	};

	var setGlobal = function (key, value) {
	  try {
	    hide(global_1, key, value);
	  } catch (error) {
	    global_1[key] = value;
	  } return value;
	};

	var isPure = false;

	var shared = createCommonjsModule(function (module) {
	var SHARED = '__core-js_shared__';
	var store = global_1[SHARED] || setGlobal(SHARED, {});

	(module.exports = function (key, value) {
	  return store[key] || (store[key] = value !== undefined ? value : {});
	})('versions', []).push({
	  version: '3.2.1',
	  mode:  'global',
	  copyright: '© 2019 Denis Pushkarev (zloirock.ru)'
	});
	});

	var functionToString = shared('native-function-to-string', Function.toString);

	var WeakMap = global_1.WeakMap;

	var nativeWeakMap = typeof WeakMap === 'function' && /native code/.test(functionToString.call(WeakMap));

	var id = 0;
	var postfix = Math.random();

	var uid = function (key) {
	  return 'Symbol(' + String(key === undefined ? '' : key) + ')_' + (++id + postfix).toString(36);
	};

	var keys = shared('keys');

	var sharedKey = function (key) {
	  return keys[key] || (keys[key] = uid(key));
	};

	var hiddenKeys = {};

	var WeakMap$1 = global_1.WeakMap;
	var set, get, has$1;

	var enforce = function (it) {
	  return has$1(it) ? get(it) : set(it, {});
	};

	var getterFor = function (TYPE) {
	  return function (it) {
	    var state;
	    if (!isObject(it) || (state = get(it)).type !== TYPE) {
	      throw TypeError('Incompatible receiver, ' + TYPE + ' required');
	    } return state;
	  };
	};

	if (nativeWeakMap) {
	  var store = new WeakMap$1();
	  var wmget = store.get;
	  var wmhas = store.has;
	  var wmset = store.set;
	  set = function (it, metadata) {
	    wmset.call(store, it, metadata);
	    return metadata;
	  };
	  get = function (it) {
	    return wmget.call(store, it) || {};
	  };
	  has$1 = function (it) {
	    return wmhas.call(store, it);
	  };
	} else {
	  var STATE = sharedKey('state');
	  hiddenKeys[STATE] = true;
	  set = function (it, metadata) {
	    hide(it, STATE, metadata);
	    return metadata;
	  };
	  get = function (it) {
	    return has(it, STATE) ? it[STATE] : {};
	  };
	  has$1 = function (it) {
	    return has(it, STATE);
	  };
	}

	var internalState = {
	  set: set,
	  get: get,
	  has: has$1,
	  enforce: enforce,
	  getterFor: getterFor
	};

	var redefine = createCommonjsModule(function (module) {
	var getInternalState = internalState.get;
	var enforceInternalState = internalState.enforce;
	var TEMPLATE = String(functionToString).split('toString');

	shared('inspectSource', function (it) {
	  return functionToString.call(it);
	});

	(module.exports = function (O, key, value, options) {
	  var unsafe = options ? !!options.unsafe : false;
	  var simple = options ? !!options.enumerable : false;
	  var noTargetGet = options ? !!options.noTargetGet : false;
	  if (typeof value == 'function') {
	    if (typeof key == 'string' && !has(value, 'name')) hide(value, 'name', key);
	    enforceInternalState(value).source = TEMPLATE.join(typeof key == 'string' ? key : '');
	  }
	  if (O === global_1) {
	    if (simple) O[key] = value;
	    else setGlobal(key, value);
	    return;
	  } else if (!unsafe) {
	    delete O[key];
	  } else if (!noTargetGet && O[key]) {
	    simple = true;
	  }
	  if (simple) O[key] = value;
	  else hide(O, key, value);
	// add fake Function#toString for correct work wrapped methods / constructors with methods like LoDash isNative
	})(Function.prototype, 'toString', function toString() {
	  return typeof this == 'function' && getInternalState(this).source || functionToString.call(this);
	});
	});

	var path = global_1;

	var aFunction = function (variable) {
	  return typeof variable == 'function' ? variable : undefined;
	};

	var getBuiltIn = function (namespace, method) {
	  return arguments.length < 2 ? aFunction(path[namespace]) || aFunction(global_1[namespace])
	    : path[namespace] && path[namespace][method] || global_1[namespace] && global_1[namespace][method];
	};

	var ceil = Math.ceil;
	var floor = Math.floor;

	// `ToInteger` abstract operation
	// https://tc39.github.io/ecma262/#sec-tointeger
	var toInteger = function (argument) {
	  return isNaN(argument = +argument) ? 0 : (argument > 0 ? floor : ceil)(argument);
	};

	var min = Math.min;

	// `ToLength` abstract operation
	// https://tc39.github.io/ecma262/#sec-tolength
	var toLength = function (argument) {
	  return argument > 0 ? min(toInteger(argument), 0x1FFFFFFFFFFFFF) : 0; // 2 ** 53 - 1 == 9007199254740991
	};

	var max = Math.max;
	var min$1 = Math.min;

	// Helper for a popular repeating case of the spec:
	// Let integer be ? ToInteger(index).
	// If integer < 0, let result be max((length + integer), 0); else let result be min(length, length).
	var toAbsoluteIndex = function (index, length) {
	  var integer = toInteger(index);
	  return integer < 0 ? max(integer + length, 0) : min$1(integer, length);
	};

	// `Array.prototype.{ indexOf, includes }` methods implementation
	var createMethod = function (IS_INCLUDES) {
	  return function ($this, el, fromIndex) {
	    var O = toIndexedObject($this);
	    var length = toLength(O.length);
	    var index = toAbsoluteIndex(fromIndex, length);
	    var value;
	    // Array#includes uses SameValueZero equality algorithm
	    // eslint-disable-next-line no-self-compare
	    if (IS_INCLUDES && el != el) while (length > index) {
	      value = O[index++];
	      // eslint-disable-next-line no-self-compare
	      if (value != value) return true;
	    // Array#indexOf ignores holes, Array#includes - not
	    } else for (;length > index; index++) {
	      if ((IS_INCLUDES || index in O) && O[index] === el) return IS_INCLUDES || index || 0;
	    } return !IS_INCLUDES && -1;
	  };
	};

	var arrayIncludes = {
	  // `Array.prototype.includes` method
	  // https://tc39.github.io/ecma262/#sec-array.prototype.includes
	  includes: createMethod(true),
	  // `Array.prototype.indexOf` method
	  // https://tc39.github.io/ecma262/#sec-array.prototype.indexof
	  indexOf: createMethod(false)
	};

	var indexOf = arrayIncludes.indexOf;


	var objectKeysInternal = function (object, names) {
	  var O = toIndexedObject(object);
	  var i = 0;
	  var result = [];
	  var key;
	  for (key in O) !has(hiddenKeys, key) && has(O, key) && result.push(key);
	  // Don't enum bug & hidden keys
	  while (names.length > i) if (has(O, key = names[i++])) {
	    ~indexOf(result, key) || result.push(key);
	  }
	  return result;
	};

	// IE8- don't enum bug keys
	var enumBugKeys = [
	  'constructor',
	  'hasOwnProperty',
	  'isPrototypeOf',
	  'propertyIsEnumerable',
	  'toLocaleString',
	  'toString',
	  'valueOf'
	];

	var hiddenKeys$1 = enumBugKeys.concat('length', 'prototype');

	// `Object.getOwnPropertyNames` method
	// https://tc39.github.io/ecma262/#sec-object.getownpropertynames
	var f$3 = Object.getOwnPropertyNames || function getOwnPropertyNames(O) {
	  return objectKeysInternal(O, hiddenKeys$1);
	};

	var objectGetOwnPropertyNames = {
		f: f$3
	};

	var f$4 = Object.getOwnPropertySymbols;

	var objectGetOwnPropertySymbols = {
		f: f$4
	};

	// all object keys, includes non-enumerable and symbols
	var ownKeys = getBuiltIn('Reflect', 'ownKeys') || function ownKeys(it) {
	  var keys = objectGetOwnPropertyNames.f(anObject(it));
	  var getOwnPropertySymbols = objectGetOwnPropertySymbols.f;
	  return getOwnPropertySymbols ? keys.concat(getOwnPropertySymbols(it)) : keys;
	};

	var copyConstructorProperties = function (target, source) {
	  var keys = ownKeys(source);
	  var defineProperty = objectDefineProperty.f;
	  var getOwnPropertyDescriptor = objectGetOwnPropertyDescriptor.f;
	  for (var i = 0; i < keys.length; i++) {
	    var key = keys[i];
	    if (!has(target, key)) defineProperty(target, key, getOwnPropertyDescriptor(source, key));
	  }
	};

	var replacement = /#|\.prototype\./;

	var isForced = function (feature, detection) {
	  var value = data[normalize(feature)];
	  return value == POLYFILL ? true
	    : value == NATIVE ? false
	    : typeof detection == 'function' ? fails(detection)
	    : !!detection;
	};

	var normalize = isForced.normalize = function (string) {
	  return String(string).replace(replacement, '.').toLowerCase();
	};

	var data = isForced.data = {};
	var NATIVE = isForced.NATIVE = 'N';
	var POLYFILL = isForced.POLYFILL = 'P';

	var isForced_1 = isForced;

	var getOwnPropertyDescriptor$1 = objectGetOwnPropertyDescriptor.f;






	/*
	  options.target      - name of the target object
	  options.global      - target is the global object
	  options.stat        - export as static methods of target
	  options.proto       - export as prototype methods of target
	  options.real        - real prototype method for the `pure` version
	  options.forced      - export even if the native feature is available
	  options.bind        - bind methods to the target, required for the `pure` version
	  options.wrap        - wrap constructors to preventing global pollution, required for the `pure` version
	  options.unsafe      - use the simple assignment of property instead of delete + defineProperty
	  options.sham        - add a flag to not completely full polyfills
	  options.enumerable  - export as enumerable property
	  options.noTargetGet - prevent calling a getter on target
	*/
	var _export = function (options, source) {
	  var TARGET = options.target;
	  var GLOBAL = options.global;
	  var STATIC = options.stat;
	  var FORCED, target, key, targetProperty, sourceProperty, descriptor;
	  if (GLOBAL) {
	    target = global_1;
	  } else if (STATIC) {
	    target = global_1[TARGET] || setGlobal(TARGET, {});
	  } else {
	    target = (global_1[TARGET] || {}).prototype;
	  }
	  if (target) for (key in source) {
	    sourceProperty = source[key];
	    if (options.noTargetGet) {
	      descriptor = getOwnPropertyDescriptor$1(target, key);
	      targetProperty = descriptor && descriptor.value;
	    } else targetProperty = target[key];
	    FORCED = isForced_1(GLOBAL ? key : TARGET + (STATIC ? '.' : '#') + key, options.forced);
	    // contained in target
	    if (!FORCED && targetProperty !== undefined) {
	      if (typeof sourceProperty === typeof targetProperty) continue;
	      copyConstructorProperties(sourceProperty, targetProperty);
	    }
	    // add a flag to not completely full polyfills
	    if (options.sham || (targetProperty && targetProperty.sham)) {
	      hide(sourceProperty, 'sham', true);
	    }
	    // extend global
	    redefine(target, key, sourceProperty, options);
	  }
	};

	var defineProperty = objectDefineProperty.f;


	var NativeSymbol = global_1.Symbol;

	if (descriptors && typeof NativeSymbol == 'function' && (!('description' in NativeSymbol.prototype) ||
	  // Safari 12 bug
	  NativeSymbol().description !== undefined
	)) {
	  var EmptyStringDescriptionStore = {};
	  // wrap Symbol constructor for correct work with undefined description
	  var SymbolWrapper = function Symbol() {
	    var description = arguments.length < 1 || arguments[0] === undefined ? undefined : String(arguments[0]);
	    var result = this instanceof SymbolWrapper
	      ? new NativeSymbol(description)
	      // in Edge 13, String(Symbol(undefined)) === 'Symbol(undefined)'
	      : description === undefined ? NativeSymbol() : NativeSymbol(description);
	    if (description === '') EmptyStringDescriptionStore[result] = true;
	    return result;
	  };
	  copyConstructorProperties(SymbolWrapper, NativeSymbol);
	  var symbolPrototype = SymbolWrapper.prototype = NativeSymbol.prototype;
	  symbolPrototype.constructor = SymbolWrapper;

	  var symbolToString = symbolPrototype.toString;
	  var native = String(NativeSymbol('test')) == 'Symbol(test)';
	  var regexp = /^Symbol\((.*)\)[^)]+$/;
	  defineProperty(symbolPrototype, 'description', {
	    configurable: true,
	    get: function description() {
	      var symbol = isObject(this) ? this.valueOf() : this;
	      var string = symbolToString.call(symbol);
	      if (has(EmptyStringDescriptionStore, symbol)) return '';
	      var desc = native ? string.slice(7, -1) : string.replace(regexp, '$1');
	      return desc === '' ? undefined : desc;
	    }
	  });

	  _export({ global: true, forced: true }, {
	    Symbol: SymbolWrapper
	  });
	}

	// `IsArray` abstract operation
	// https://tc39.github.io/ecma262/#sec-isarray
	var isArray = Array.isArray || function isArray(arg) {
	  return classofRaw(arg) == 'Array';
	};

	var aFunction$1 = function (it) {
	  if (typeof it != 'function') {
	    throw TypeError(String(it) + ' is not a function');
	  } return it;
	};

	// optional / simple context binding
	var bindContext = function (fn, that, length) {
	  aFunction$1(fn);
	  if (that === undefined) return fn;
	  switch (length) {
	    case 0: return function () {
	      return fn.call(that);
	    };
	    case 1: return function (a) {
	      return fn.call(that, a);
	    };
	    case 2: return function (a, b) {
	      return fn.call(that, a, b);
	    };
	    case 3: return function (a, b, c) {
	      return fn.call(that, a, b, c);
	    };
	  }
	  return function (/* ...args */) {
	    return fn.apply(that, arguments);
	  };
	};

	// `FlattenIntoArray` abstract operation
	// https://tc39.github.io/proposal-flatMap/#sec-FlattenIntoArray
	var flattenIntoArray = function (target, original, source, sourceLen, start, depth, mapper, thisArg) {
	  var targetIndex = start;
	  var sourceIndex = 0;
	  var mapFn = mapper ? bindContext(mapper, thisArg, 3) : false;
	  var element;

	  while (sourceIndex < sourceLen) {
	    if (sourceIndex in source) {
	      element = mapFn ? mapFn(source[sourceIndex], sourceIndex, original) : source[sourceIndex];

	      if (depth > 0 && isArray(element)) {
	        targetIndex = flattenIntoArray(target, original, element, toLength(element.length), targetIndex, depth - 1) - 1;
	      } else {
	        if (targetIndex >= 0x1FFFFFFFFFFFFF) throw TypeError('Exceed the acceptable array length');
	        target[targetIndex] = element;
	      }

	      targetIndex++;
	    }
	    sourceIndex++;
	  }
	  return targetIndex;
	};

	var flattenIntoArray_1 = flattenIntoArray;

	// `ToObject` abstract operation
	// https://tc39.github.io/ecma262/#sec-toobject
	var toObject = function (argument) {
	  return Object(requireObjectCoercible(argument));
	};

	var nativeSymbol = !!Object.getOwnPropertySymbols && !fails(function () {
	  // Chrome 38 Symbol has incorrect toString conversion
	  // eslint-disable-next-line no-undef
	  return !String(Symbol());
	});

	var Symbol$1 = global_1.Symbol;
	var store$1 = shared('wks');

	var wellKnownSymbol = function (name) {
	  return store$1[name] || (store$1[name] = nativeSymbol && Symbol$1[name]
	    || (nativeSymbol ? Symbol$1 : uid)('Symbol.' + name));
	};

	var SPECIES = wellKnownSymbol('species');

	// `ArraySpeciesCreate` abstract operation
	// https://tc39.github.io/ecma262/#sec-arrayspeciescreate
	var arraySpeciesCreate = function (originalArray, length) {
	  var C;
	  if (isArray(originalArray)) {
	    C = originalArray.constructor;
	    // cross-realm fallback
	    if (typeof C == 'function' && (C === Array || isArray(C.prototype))) C = undefined;
	    else if (isObject(C)) {
	      C = C[SPECIES];
	      if (C === null) C = undefined;
	    }
	  } return new (C === undefined ? Array : C)(length === 0 ? 0 : length);
	};

	// `Array.prototype.flatMap` method
	// https://github.com/tc39/proposal-flatMap
	_export({ target: 'Array', proto: true }, {
	  flatMap: function flatMap(callbackfn /* , thisArg */) {
	    var O = toObject(this);
	    var sourceLen = toLength(O.length);
	    var A;
	    aFunction$1(callbackfn);
	    A = arraySpeciesCreate(O, 0);
	    A.length = flattenIntoArray_1(A, O, O, sourceLen, 0, 1, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
	    return A;
	  }
	});

	// `Object.keys` method
	// https://tc39.github.io/ecma262/#sec-object.keys
	var objectKeys = Object.keys || function keys(O) {
	  return objectKeysInternal(O, enumBugKeys);
	};

	// `Object.defineProperties` method
	// https://tc39.github.io/ecma262/#sec-object.defineproperties
	var objectDefineProperties = descriptors ? Object.defineProperties : function defineProperties(O, Properties) {
	  anObject(O);
	  var keys = objectKeys(Properties);
	  var length = keys.length;
	  var index = 0;
	  var key;
	  while (length > index) objectDefineProperty.f(O, key = keys[index++], Properties[key]);
	  return O;
	};

	var html = getBuiltIn('document', 'documentElement');

	var IE_PROTO = sharedKey('IE_PROTO');

	var PROTOTYPE = 'prototype';
	var Empty = function () { /* empty */ };

	// Create object with fake `null` prototype: use iframe Object with cleared prototype
	var createDict = function () {
	  // Thrash, waste and sodomy: IE GC bug
	  var iframe = documentCreateElement('iframe');
	  var length = enumBugKeys.length;
	  var lt = '<';
	  var script = 'script';
	  var gt = '>';
	  var js = 'java' + script + ':';
	  var iframeDocument;
	  iframe.style.display = 'none';
	  html.appendChild(iframe);
	  iframe.src = String(js);
	  iframeDocument = iframe.contentWindow.document;
	  iframeDocument.open();
	  iframeDocument.write(lt + script + gt + 'document.F=Object' + lt + '/' + script + gt);
	  iframeDocument.close();
	  createDict = iframeDocument.F;
	  while (length--) delete createDict[PROTOTYPE][enumBugKeys[length]];
	  return createDict();
	};

	// `Object.create` method
	// https://tc39.github.io/ecma262/#sec-object.create
	var objectCreate = Object.create || function create(O, Properties) {
	  var result;
	  if (O !== null) {
	    Empty[PROTOTYPE] = anObject(O);
	    result = new Empty();
	    Empty[PROTOTYPE] = null;
	    // add "__proto__" for Object.getPrototypeOf polyfill
	    result[IE_PROTO] = O;
	  } else result = createDict();
	  return Properties === undefined ? result : objectDefineProperties(result, Properties);
	};

	hiddenKeys[IE_PROTO] = true;

	var UNSCOPABLES = wellKnownSymbol('unscopables');
	var ArrayPrototype = Array.prototype;

	// Array.prototype[@@unscopables]
	// https://tc39.github.io/ecma262/#sec-array.prototype-@@unscopables
	if (ArrayPrototype[UNSCOPABLES] == undefined) {
	  hide(ArrayPrototype, UNSCOPABLES, objectCreate(null));
	}

	// add a key to Array.prototype[@@unscopables]
	var addToUnscopables = function (key) {
	  ArrayPrototype[UNSCOPABLES][key] = true;
	};

	var correctPrototypeGetter = !fails(function () {
	  function F() { /* empty */ }
	  F.prototype.constructor = null;
	  return Object.getPrototypeOf(new F()) !== F.prototype;
	});

	var IE_PROTO$1 = sharedKey('IE_PROTO');
	var ObjectPrototype = Object.prototype;

	// `Object.getPrototypeOf` method
	// https://tc39.github.io/ecma262/#sec-object.getprototypeof
	var objectGetPrototypeOf = correctPrototypeGetter ? Object.getPrototypeOf : function (O) {
	  O = toObject(O);
	  if (has(O, IE_PROTO$1)) return O[IE_PROTO$1];
	  if (typeof O.constructor == 'function' && O instanceof O.constructor) {
	    return O.constructor.prototype;
	  } return O instanceof Object ? ObjectPrototype : null;
	};

	var ITERATOR = wellKnownSymbol('iterator');
	var BUGGY_SAFARI_ITERATORS = false;

	var returnThis = function () { return this; };

	// `%IteratorPrototype%` object
	// https://tc39.github.io/ecma262/#sec-%iteratorprototype%-object
	var IteratorPrototype, PrototypeOfArrayIteratorPrototype, arrayIterator;

	if ([].keys) {
	  arrayIterator = [].keys();
	  // Safari 8 has buggy iterators w/o `next`
	  if (!('next' in arrayIterator)) BUGGY_SAFARI_ITERATORS = true;
	  else {
	    PrototypeOfArrayIteratorPrototype = objectGetPrototypeOf(objectGetPrototypeOf(arrayIterator));
	    if (PrototypeOfArrayIteratorPrototype !== Object.prototype) IteratorPrototype = PrototypeOfArrayIteratorPrototype;
	  }
	}

	if (IteratorPrototype == undefined) IteratorPrototype = {};

	// 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
	if ( !has(IteratorPrototype, ITERATOR)) hide(IteratorPrototype, ITERATOR, returnThis);

	var iteratorsCore = {
	  IteratorPrototype: IteratorPrototype,
	  BUGGY_SAFARI_ITERATORS: BUGGY_SAFARI_ITERATORS
	};

	var defineProperty$1 = objectDefineProperty.f;



	var TO_STRING_TAG = wellKnownSymbol('toStringTag');

	var setToStringTag = function (it, TAG, STATIC) {
	  if (it && !has(it = STATIC ? it : it.prototype, TO_STRING_TAG)) {
	    defineProperty$1(it, TO_STRING_TAG, { configurable: true, value: TAG });
	  }
	};

	var IteratorPrototype$1 = iteratorsCore.IteratorPrototype;

	var createIteratorConstructor = function (IteratorConstructor, NAME, next) {
	  var TO_STRING_TAG = NAME + ' Iterator';
	  IteratorConstructor.prototype = objectCreate(IteratorPrototype$1, { next: createPropertyDescriptor(1, next) });
	  setToStringTag(IteratorConstructor, TO_STRING_TAG, false);
	  return IteratorConstructor;
	};

	var aPossiblePrototype = function (it) {
	  if (!isObject(it) && it !== null) {
	    throw TypeError("Can't set " + String(it) + ' as a prototype');
	  } return it;
	};

	// `Object.setPrototypeOf` method
	// https://tc39.github.io/ecma262/#sec-object.setprototypeof
	// Works with __proto__ only. Old v8 can't work with null proto objects.
	/* eslint-disable no-proto */
	var objectSetPrototypeOf = Object.setPrototypeOf || ('__proto__' in {} ? function () {
	  var CORRECT_SETTER = false;
	  var test = {};
	  var setter;
	  try {
	    setter = Object.getOwnPropertyDescriptor(Object.prototype, '__proto__').set;
	    setter.call(test, []);
	    CORRECT_SETTER = test instanceof Array;
	  } catch (error) { /* empty */ }
	  return function setPrototypeOf(O, proto) {
	    anObject(O);
	    aPossiblePrototype(proto);
	    if (CORRECT_SETTER) setter.call(O, proto);
	    else O.__proto__ = proto;
	    return O;
	  };
	}() : undefined);

	var IteratorPrototype$2 = iteratorsCore.IteratorPrototype;
	var BUGGY_SAFARI_ITERATORS$1 = iteratorsCore.BUGGY_SAFARI_ITERATORS;
	var ITERATOR$1 = wellKnownSymbol('iterator');
	var KEYS = 'keys';
	var VALUES = 'values';
	var ENTRIES = 'entries';

	var returnThis$1 = function () { return this; };

	var defineIterator = function (Iterable, NAME, IteratorConstructor, next, DEFAULT, IS_SET, FORCED) {
	  createIteratorConstructor(IteratorConstructor, NAME, next);

	  var getIterationMethod = function (KIND) {
	    if (KIND === DEFAULT && defaultIterator) return defaultIterator;
	    if (!BUGGY_SAFARI_ITERATORS$1 && KIND in IterablePrototype) return IterablePrototype[KIND];
	    switch (KIND) {
	      case KEYS: return function keys() { return new IteratorConstructor(this, KIND); };
	      case VALUES: return function values() { return new IteratorConstructor(this, KIND); };
	      case ENTRIES: return function entries() { return new IteratorConstructor(this, KIND); };
	    } return function () { return new IteratorConstructor(this); };
	  };

	  var TO_STRING_TAG = NAME + ' Iterator';
	  var INCORRECT_VALUES_NAME = false;
	  var IterablePrototype = Iterable.prototype;
	  var nativeIterator = IterablePrototype[ITERATOR$1]
	    || IterablePrototype['@@iterator']
	    || DEFAULT && IterablePrototype[DEFAULT];
	  var defaultIterator = !BUGGY_SAFARI_ITERATORS$1 && nativeIterator || getIterationMethod(DEFAULT);
	  var anyNativeIterator = NAME == 'Array' ? IterablePrototype.entries || nativeIterator : nativeIterator;
	  var CurrentIteratorPrototype, methods, KEY;

	  // fix native
	  if (anyNativeIterator) {
	    CurrentIteratorPrototype = objectGetPrototypeOf(anyNativeIterator.call(new Iterable()));
	    if (IteratorPrototype$2 !== Object.prototype && CurrentIteratorPrototype.next) {
	      if ( objectGetPrototypeOf(CurrentIteratorPrototype) !== IteratorPrototype$2) {
	        if (objectSetPrototypeOf) {
	          objectSetPrototypeOf(CurrentIteratorPrototype, IteratorPrototype$2);
	        } else if (typeof CurrentIteratorPrototype[ITERATOR$1] != 'function') {
	          hide(CurrentIteratorPrototype, ITERATOR$1, returnThis$1);
	        }
	      }
	      // Set @@toStringTag to native iterators
	      setToStringTag(CurrentIteratorPrototype, TO_STRING_TAG, true);
	    }
	  }

	  // fix Array#{values, @@iterator}.name in V8 / FF
	  if (DEFAULT == VALUES && nativeIterator && nativeIterator.name !== VALUES) {
	    INCORRECT_VALUES_NAME = true;
	    defaultIterator = function values() { return nativeIterator.call(this); };
	  }

	  // define iterator
	  if ( IterablePrototype[ITERATOR$1] !== defaultIterator) {
	    hide(IterablePrototype, ITERATOR$1, defaultIterator);
	  }

	  // export additional methods
	  if (DEFAULT) {
	    methods = {
	      values: getIterationMethod(VALUES),
	      keys: IS_SET ? defaultIterator : getIterationMethod(KEYS),
	      entries: getIterationMethod(ENTRIES)
	    };
	    if (FORCED) for (KEY in methods) {
	      if (BUGGY_SAFARI_ITERATORS$1 || INCORRECT_VALUES_NAME || !(KEY in IterablePrototype)) {
	        redefine(IterablePrototype, KEY, methods[KEY]);
	      }
	    } else _export({ target: NAME, proto: true, forced: BUGGY_SAFARI_ITERATORS$1 || INCORRECT_VALUES_NAME }, methods);
	  }

	  return methods;
	};

	var ARRAY_ITERATOR = 'Array Iterator';
	var setInternalState = internalState.set;
	var getInternalState = internalState.getterFor(ARRAY_ITERATOR);

	// `Array.prototype.entries` method
	// https://tc39.github.io/ecma262/#sec-array.prototype.entries
	// `Array.prototype.keys` method
	// https://tc39.github.io/ecma262/#sec-array.prototype.keys
	// `Array.prototype.values` method
	// https://tc39.github.io/ecma262/#sec-array.prototype.values
	// `Array.prototype[@@iterator]` method
	// https://tc39.github.io/ecma262/#sec-array.prototype-@@iterator
	// `CreateArrayIterator` internal method
	// https://tc39.github.io/ecma262/#sec-createarrayiterator
	var es_array_iterator = defineIterator(Array, 'Array', function (iterated, kind) {
	  setInternalState(this, {
	    type: ARRAY_ITERATOR,
	    target: toIndexedObject(iterated), // target
	    index: 0,                          // next index
	    kind: kind                         // kind
	  });
	// `%ArrayIteratorPrototype%.next` method
	// https://tc39.github.io/ecma262/#sec-%arrayiteratorprototype%.next
	}, function () {
	  var state = getInternalState(this);
	  var target = state.target;
	  var kind = state.kind;
	  var index = state.index++;
	  if (!target || index >= target.length) {
	    state.target = undefined;
	    return { value: undefined, done: true };
	  }
	  if (kind == 'keys') return { value: index, done: false };
	  if (kind == 'values') return { value: target[index], done: false };
	  return { value: [index, target[index]], done: false };
	}, 'values');

	// https://tc39.github.io/ecma262/#sec-array.prototype-@@unscopables
	addToUnscopables('keys');
	addToUnscopables('values');
	addToUnscopables('entries');

	// this method was added to unscopables after implementation
	// in popular engines, so it's moved to a separate module


	addToUnscopables('flatMap');

	// `RegExp.prototype.flags` getter implementation
	// https://tc39.github.io/ecma262/#sec-get-regexp.prototype.flags
	var regexpFlags = function () {
	  var that = anObject(this);
	  var result = '';
	  if (that.global) result += 'g';
	  if (that.ignoreCase) result += 'i';
	  if (that.multiline) result += 'm';
	  if (that.dotAll) result += 's';
	  if (that.unicode) result += 'u';
	  if (that.sticky) result += 'y';
	  return result;
	};

	var nativeExec = RegExp.prototype.exec;
	// This always refers to the native implementation, because the
	// String#replace polyfill uses ./fix-regexp-well-known-symbol-logic.js,
	// which loads this file before patching the method.
	var nativeReplace = String.prototype.replace;

	var patchedExec = nativeExec;

	var UPDATES_LAST_INDEX_WRONG = (function () {
	  var re1 = /a/;
	  var re2 = /b*/g;
	  nativeExec.call(re1, 'a');
	  nativeExec.call(re2, 'a');
	  return re1.lastIndex !== 0 || re2.lastIndex !== 0;
	})();

	// nonparticipating capturing group, copied from es5-shim's String#split patch.
	var NPCG_INCLUDED = /()??/.exec('')[1] !== undefined;

	var PATCH = UPDATES_LAST_INDEX_WRONG || NPCG_INCLUDED;

	if (PATCH) {
	  patchedExec = function exec(str) {
	    var re = this;
	    var lastIndex, reCopy, match, i;

	    if (NPCG_INCLUDED) {
	      reCopy = new RegExp('^' + re.source + '$(?!\\s)', regexpFlags.call(re));
	    }
	    if (UPDATES_LAST_INDEX_WRONG) lastIndex = re.lastIndex;

	    match = nativeExec.call(re, str);

	    if (UPDATES_LAST_INDEX_WRONG && match) {
	      re.lastIndex = re.global ? match.index + match[0].length : lastIndex;
	    }
	    if (NPCG_INCLUDED && match && match.length > 1) {
	      // Fix browsers whose `exec` methods don't consistently return `undefined`
	      // for NPCG, like IE8. NOTE: This doesn' work for /(.?)?/
	      nativeReplace.call(match[0], reCopy, function () {
	        for (i = 1; i < arguments.length - 2; i++) {
	          if (arguments[i] === undefined) match[i] = undefined;
	        }
	      });
	    }

	    return match;
	  };
	}

	var regexpExec = patchedExec;

	var SPECIES$1 = wellKnownSymbol('species');

	var REPLACE_SUPPORTS_NAMED_GROUPS = !fails(function () {
	  // #replace needs built-in support for named groups.
	  // #match works fine because it just return the exec results, even if it has
	  // a "grops" property.
	  var re = /./;
	  re.exec = function () {
	    var result = [];
	    result.groups = { a: '7' };
	    return result;
	  };
	  return ''.replace(re, '$<a>') !== '7';
	});

	// Chrome 51 has a buggy "split" implementation when RegExp#exec !== nativeExec
	// Weex JS has frozen built-in prototypes, so use try / catch wrapper
	var SPLIT_WORKS_WITH_OVERWRITTEN_EXEC = !fails(function () {
	  var re = /(?:)/;
	  var originalExec = re.exec;
	  re.exec = function () { return originalExec.apply(this, arguments); };
	  var result = 'ab'.split(re);
	  return result.length !== 2 || result[0] !== 'a' || result[1] !== 'b';
	});

	var fixRegexpWellKnownSymbolLogic = function (KEY, length, exec, sham) {
	  var SYMBOL = wellKnownSymbol(KEY);

	  var DELEGATES_TO_SYMBOL = !fails(function () {
	    // String methods call symbol-named RegEp methods
	    var O = {};
	    O[SYMBOL] = function () { return 7; };
	    return ''[KEY](O) != 7;
	  });

	  var DELEGATES_TO_EXEC = DELEGATES_TO_SYMBOL && !fails(function () {
	    // Symbol-named RegExp methods call .exec
	    var execCalled = false;
	    var re = /a/;
	    re.exec = function () { execCalled = true; return null; };

	    if (KEY === 'split') {
	      // RegExp[@@split] doesn't call the regex's exec method, but first creates
	      // a new one. We need to return the patched regex when creating the new one.
	      re.constructor = {};
	      re.constructor[SPECIES$1] = function () { return re; };
	    }

	    re[SYMBOL]('');
	    return !execCalled;
	  });

	  if (
	    !DELEGATES_TO_SYMBOL ||
	    !DELEGATES_TO_EXEC ||
	    (KEY === 'replace' && !REPLACE_SUPPORTS_NAMED_GROUPS) ||
	    (KEY === 'split' && !SPLIT_WORKS_WITH_OVERWRITTEN_EXEC)
	  ) {
	    var nativeRegExpMethod = /./[SYMBOL];
	    var methods = exec(SYMBOL, ''[KEY], function (nativeMethod, regexp, str, arg2, forceStringMethod) {
	      if (regexp.exec === regexpExec) {
	        if (DELEGATES_TO_SYMBOL && !forceStringMethod) {
	          // The native String method already delegates to @@method (this
	          // polyfilled function), leasing to infinite recursion.
	          // We avoid it by directly calling the native @@method method.
	          return { done: true, value: nativeRegExpMethod.call(regexp, str, arg2) };
	        }
	        return { done: true, value: nativeMethod.call(str, regexp, arg2) };
	      }
	      return { done: false };
	    });
	    var stringMethod = methods[0];
	    var regexMethod = methods[1];

	    redefine(String.prototype, KEY, stringMethod);
	    redefine(RegExp.prototype, SYMBOL, length == 2
	      // 21.2.5.8 RegExp.prototype[@@replace](string, replaceValue)
	      // 21.2.5.11 RegExp.prototype[@@split](string, limit)
	      ? function (string, arg) { return regexMethod.call(string, this, arg); }
	      // 21.2.5.6 RegExp.prototype[@@match](string)
	      // 21.2.5.9 RegExp.prototype[@@search](string)
	      : function (string) { return regexMethod.call(string, this); }
	    );
	    if (sham) hide(RegExp.prototype[SYMBOL], 'sham', true);
	  }
	};

	// `String.prototype.{ codePointAt, at }` methods implementation
	var createMethod$1 = function (CONVERT_TO_STRING) {
	  return function ($this, pos) {
	    var S = String(requireObjectCoercible($this));
	    var position = toInteger(pos);
	    var size = S.length;
	    var first, second;
	    if (position < 0 || position >= size) return CONVERT_TO_STRING ? '' : undefined;
	    first = S.charCodeAt(position);
	    return first < 0xD800 || first > 0xDBFF || position + 1 === size
	      || (second = S.charCodeAt(position + 1)) < 0xDC00 || second > 0xDFFF
	        ? CONVERT_TO_STRING ? S.charAt(position) : first
	        : CONVERT_TO_STRING ? S.slice(position, position + 2) : (first - 0xD800 << 10) + (second - 0xDC00) + 0x10000;
	  };
	};

	var stringMultibyte = {
	  // `String.prototype.codePointAt` method
	  // https://tc39.github.io/ecma262/#sec-string.prototype.codepointat
	  codeAt: createMethod$1(false),
	  // `String.prototype.at` method
	  // https://github.com/mathiasbynens/String.prototype.at
	  charAt: createMethod$1(true)
	};

	var charAt = stringMultibyte.charAt;

	// `AdvanceStringIndex` abstract operation
	// https://tc39.github.io/ecma262/#sec-advancestringindex
	var advanceStringIndex = function (S, index, unicode) {
	  return index + (unicode ? charAt(S, index).length : 1);
	};

	// `RegExpExec` abstract operation
	// https://tc39.github.io/ecma262/#sec-regexpexec
	var regexpExecAbstract = function (R, S) {
	  var exec = R.exec;
	  if (typeof exec === 'function') {
	    var result = exec.call(R, S);
	    if (typeof result !== 'object') {
	      throw TypeError('RegExp exec method returned something other than an Object or null');
	    }
	    return result;
	  }

	  if (classofRaw(R) !== 'RegExp') {
	    throw TypeError('RegExp#exec called on incompatible receiver');
	  }

	  return regexpExec.call(R, S);
	};

	var max$1 = Math.max;
	var min$2 = Math.min;
	var floor$1 = Math.floor;
	var SUBSTITUTION_SYMBOLS = /\$([$&'`]|\d\d?|<[^>]*>)/g;
	var SUBSTITUTION_SYMBOLS_NO_NAMED = /\$([$&'`]|\d\d?)/g;

	var maybeToString = function (it) {
	  return it === undefined ? it : String(it);
	};

	// @@replace logic
	fixRegexpWellKnownSymbolLogic('replace', 2, function (REPLACE, nativeReplace, maybeCallNative) {
	  return [
	    // `String.prototype.replace` method
	    // https://tc39.github.io/ecma262/#sec-string.prototype.replace
	    function replace(searchValue, replaceValue) {
	      var O = requireObjectCoercible(this);
	      var replacer = searchValue == undefined ? undefined : searchValue[REPLACE];
	      return replacer !== undefined
	        ? replacer.call(searchValue, O, replaceValue)
	        : nativeReplace.call(String(O), searchValue, replaceValue);
	    },
	    // `RegExp.prototype[@@replace]` method
	    // https://tc39.github.io/ecma262/#sec-regexp.prototype-@@replace
	    function (regexp, replaceValue) {
	      var res = maybeCallNative(nativeReplace, regexp, this, replaceValue);
	      if (res.done) return res.value;

	      var rx = anObject(regexp);
	      var S = String(this);

	      var functionalReplace = typeof replaceValue === 'function';
	      if (!functionalReplace) replaceValue = String(replaceValue);

	      var global = rx.global;
	      if (global) {
	        var fullUnicode = rx.unicode;
	        rx.lastIndex = 0;
	      }
	      var results = [];
	      while (true) {
	        var result = regexpExecAbstract(rx, S);
	        if (result === null) break;

	        results.push(result);
	        if (!global) break;

	        var matchStr = String(result[0]);
	        if (matchStr === '') rx.lastIndex = advanceStringIndex(S, toLength(rx.lastIndex), fullUnicode);
	      }

	      var accumulatedResult = '';
	      var nextSourcePosition = 0;
	      for (var i = 0; i < results.length; i++) {
	        result = results[i];

	        var matched = String(result[0]);
	        var position = max$1(min$2(toInteger(result.index), S.length), 0);
	        var captures = [];
	        // NOTE: This is equivalent to
	        //   captures = result.slice(1).map(maybeToString)
	        // but for some reason `nativeSlice.call(result, 1, result.length)` (called in
	        // the slice polyfill when slicing native arrays) "doesn't work" in safari 9 and
	        // causes a crash (https://pastebin.com/N21QzeQA) when trying to debug it.
	        for (var j = 1; j < result.length; j++) captures.push(maybeToString(result[j]));
	        var namedCaptures = result.groups;
	        if (functionalReplace) {
	          var replacerArgs = [matched].concat(captures, position, S);
	          if (namedCaptures !== undefined) replacerArgs.push(namedCaptures);
	          var replacement = String(replaceValue.apply(undefined, replacerArgs));
	        } else {
	          replacement = getSubstitution(matched, S, position, captures, namedCaptures, replaceValue);
	        }
	        if (position >= nextSourcePosition) {
	          accumulatedResult += S.slice(nextSourcePosition, position) + replacement;
	          nextSourcePosition = position + matched.length;
	        }
	      }
	      return accumulatedResult + S.slice(nextSourcePosition);
	    }
	  ];

	  // https://tc39.github.io/ecma262/#sec-getsubstitution
	  function getSubstitution(matched, str, position, captures, namedCaptures, replacement) {
	    var tailPos = position + matched.length;
	    var m = captures.length;
	    var symbols = SUBSTITUTION_SYMBOLS_NO_NAMED;
	    if (namedCaptures !== undefined) {
	      namedCaptures = toObject(namedCaptures);
	      symbols = SUBSTITUTION_SYMBOLS;
	    }
	    return nativeReplace.call(replacement, symbols, function (match, ch) {
	      var capture;
	      switch (ch.charAt(0)) {
	        case '$': return '$';
	        case '&': return matched;
	        case '`': return str.slice(0, position);
	        case "'": return str.slice(tailPos);
	        case '<':
	          capture = namedCaptures[ch.slice(1, -1)];
	          break;
	        default: // \d\d?
	          var n = +ch;
	          if (n === 0) return match;
	          if (n > m) {
	            var f = floor$1(n / 10);
	            if (f === 0) return match;
	            if (f <= m) return captures[f - 1] === undefined ? ch.charAt(1) : captures[f - 1] + ch.charAt(1);
	            return match;
	          }
	          capture = captures[n - 1];
	      }
	      return capture === undefined ? '' : capture;
	    });
	  }
	});

	// iterable DOM collections
	// flag - `iterable` interface - 'entries', 'keys', 'values', 'forEach' methods
	var domIterables = {
	  CSSRuleList: 0,
	  CSSStyleDeclaration: 0,
	  CSSValueList: 0,
	  ClientRectList: 0,
	  DOMRectList: 0,
	  DOMStringList: 0,
	  DOMTokenList: 1,
	  DataTransferItemList: 0,
	  FileList: 0,
	  HTMLAllCollection: 0,
	  HTMLCollection: 0,
	  HTMLFormElement: 0,
	  HTMLSelectElement: 0,
	  MediaList: 0,
	  MimeTypeArray: 0,
	  NamedNodeMap: 0,
	  NodeList: 1,
	  PaintRequestList: 0,
	  Plugin: 0,
	  PluginArray: 0,
	  SVGLengthList: 0,
	  SVGNumberList: 0,
	  SVGPathSegList: 0,
	  SVGPointList: 0,
	  SVGStringList: 0,
	  SVGTransformList: 0,
	  SourceBufferList: 0,
	  StyleSheetList: 0,
	  TextTrackCueList: 0,
	  TextTrackList: 0,
	  TouchList: 0
	};

	var ITERATOR$2 = wellKnownSymbol('iterator');
	var TO_STRING_TAG$1 = wellKnownSymbol('toStringTag');
	var ArrayValues = es_array_iterator.values;

	for (var COLLECTION_NAME in domIterables) {
	  var Collection = global_1[COLLECTION_NAME];
	  var CollectionPrototype = Collection && Collection.prototype;
	  if (CollectionPrototype) {
	    // some Chrome versions have non-configurable methods on DOMTokenList
	    if (CollectionPrototype[ITERATOR$2] !== ArrayValues) try {
	      hide(CollectionPrototype, ITERATOR$2, ArrayValues);
	    } catch (error) {
	      CollectionPrototype[ITERATOR$2] = ArrayValues;
	    }
	    if (!CollectionPrototype[TO_STRING_TAG$1]) hide(CollectionPrototype, TO_STRING_TAG$1, COLLECTION_NAME);
	    if (domIterables[COLLECTION_NAME]) for (var METHOD_NAME in es_array_iterator) {
	      // some Chrome versions have non-configurable methods on DOMTokenList
	      if (CollectionPrototype[METHOD_NAME] !== es_array_iterator[METHOD_NAME]) try {
	        hide(CollectionPrototype, METHOD_NAME, es_array_iterator[METHOD_NAME]);
	      } catch (error) {
	        CollectionPrototype[METHOD_NAME] = es_array_iterator[METHOD_NAME];
	      }
	    }
	  }
	}

	// `globalThis` object
	// https://github.com/tc39/proposal-global
	_export({ global: true }, {
	  globalThis: global_1
	});

	var f$5 = wellKnownSymbol;

	var wrappedWellKnownSymbol = {
		f: f$5
	};

	var defineProperty$2 = objectDefineProperty.f;

	var defineWellKnownSymbol = function (NAME) {
	  var Symbol = path.Symbol || (path.Symbol = {});
	  if (!has(Symbol, NAME)) defineProperty$2(Symbol, NAME, {
	    value: wrappedWellKnownSymbol.f(NAME)
	  });
	};

	// `Symbol.matchAll` well-known symbol
	defineWellKnownSymbol('matchAll');

	var TO_STRING_TAG$2 = wellKnownSymbol('toStringTag');
	// ES3 wrong here
	var CORRECT_ARGUMENTS = classofRaw(function () { return arguments; }()) == 'Arguments';

	// fallback for IE11 Script Access Denied error
	var tryGet = function (it, key) {
	  try {
	    return it[key];
	  } catch (error) { /* empty */ }
	};

	// getting tag from ES6+ `Object.prototype.toString`
	var classof = function (it) {
	  var O, tag, result;
	  return it === undefined ? 'Undefined' : it === null ? 'Null'
	    // @@toStringTag case
	    : typeof (tag = tryGet(O = Object(it), TO_STRING_TAG$2)) == 'string' ? tag
	    // builtinTag case
	    : CORRECT_ARGUMENTS ? classofRaw(O)
	    // ES3 arguments fallback
	    : (result = classofRaw(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : result;
	};

	var SPECIES$2 = wellKnownSymbol('species');

	// `SpeciesConstructor` abstract operation
	// https://tc39.github.io/ecma262/#sec-speciesconstructor
	var speciesConstructor = function (O, defaultConstructor) {
	  var C = anObject(O).constructor;
	  var S;
	  return C === undefined || (S = anObject(C)[SPECIES$2]) == undefined ? defaultConstructor : aFunction$1(S);
	};

	var MATCH_ALL = wellKnownSymbol('matchAll');
	var REGEXP_STRING = 'RegExp String';
	var REGEXP_STRING_ITERATOR = REGEXP_STRING + ' Iterator';
	var setInternalState$1 = internalState.set;
	var getInternalState$1 = internalState.getterFor(REGEXP_STRING_ITERATOR);
	var RegExpPrototype = RegExp.prototype;
	var regExpBuiltinExec = RegExpPrototype.exec;

	var regExpExec = function (R, S) {
	  var exec = R.exec;
	  var result;
	  if (typeof exec == 'function') {
	    result = exec.call(R, S);
	    if (typeof result != 'object') throw TypeError('Incorrect exec result');
	    return result;
	  } return regExpBuiltinExec.call(R, S);
	};

	// eslint-disable-next-line max-len
	var $RegExpStringIterator = createIteratorConstructor(function RegExpStringIterator(regexp, string, global, fullUnicode) {
	  setInternalState$1(this, {
	    type: REGEXP_STRING_ITERATOR,
	    regexp: regexp,
	    string: string,
	    global: global,
	    unicode: fullUnicode,
	    done: false
	  });
	}, REGEXP_STRING, function next() {
	  var state = getInternalState$1(this);
	  if (state.done) return { value: undefined, done: true };
	  var R = state.regexp;
	  var S = state.string;
	  var match = regExpExec(R, S);
	  if (match === null) return { value: undefined, done: state.done = true };
	  if (state.global) {
	    if (String(match[0]) == '') R.lastIndex = advanceStringIndex(S, toLength(R.lastIndex), state.unicode);
	    return { value: match, done: false };
	  }
	  state.done = true;
	  return { value: match, done: false };
	});

	var $matchAll = function (string) {
	  var R = anObject(this);
	  var S = String(string);
	  var C, flagsValue, flags, matcher, global, fullUnicode;
	  C = speciesConstructor(R, RegExp);
	  flagsValue = R.flags;
	  if (flagsValue === undefined && R instanceof RegExp && !('flags' in RegExpPrototype)) {
	    flagsValue = regexpFlags.call(R);
	  }
	  flags = flagsValue === undefined ? '' : String(flagsValue);
	  matcher = new C(C === RegExp ? R.source : R, flags);
	  global = !!~flags.indexOf('g');
	  fullUnicode = !!~flags.indexOf('u');
	  matcher.lastIndex = toLength(R.lastIndex);
	  return new $RegExpStringIterator(matcher, S, global, fullUnicode);
	};

	// `String.prototype.matchAll` method
	// https://github.com/tc39/proposal-string-matchall
	_export({ target: 'String', proto: true }, {
	  matchAll: function matchAll(regexp) {
	    var O = requireObjectCoercible(this);
	    var S, matcher, rx;
	    if (regexp != null) {
	      matcher = regexp[MATCH_ALL];
	      if (matcher === undefined && isPure && classof(regexp) == 'RegExp') matcher = $matchAll;
	      if (matcher != null) return aFunction$1(matcher).call(regexp, O);
	    }
	    S = String(O);
	    rx = new RegExp(regexp, 'g');
	    return  rx[MATCH_ALL](S);
	  }
	});

	 MATCH_ALL in RegExpPrototype || hide(RegExpPrototype, MATCH_ALL, $matchAll);

	/*!
	 * Copyright (c) Microsoft Corporation. All rights reserved.
	 * Licensed under the MIT license.
	 */
	class Alignment {
	  constructor(values) {
	    const copy = [];

	    for (const [o, m] of values) {
	      if (copy.length > 0) {
	        const [oPrev, mPrev] = copy[copy.length - 1];

	        if (o < oPrev) {
	          throw new Error("Original sequence position moved backwards");
	        } else if (m < mPrev) {
	          throw new Error("Modified sequence position moved backwards");
	        } else if (o === oPrev && m === mPrev) {
	          continue;
	        }
	      }

	      copy.push(Object.freeze([o, m]));
	    }

	    if (copy.length === 0) {
	      throw new Error("No sequence positions to align");
	    }

	    this.values = Object.freeze(copy);
	    this.length = copy.length;
	    Object.freeze(this);
	  }

	  static identity(start, end) {
	    if (typeof start !== "number") {
	      end = start[1];
	      start = start[0];
	    }

	    if (end === undefined) {
	      end = start;
	      start = 0;
	    }

	    const values = [];

	    for (let i = start; i <= end; ++i) {
	      values.push([i, i]);
	    }

	    return new Alignment(values);
	  }

	  static infer(original, modified, costFn) {
	    if (costFn === undefined) {
	      costFn = (o, m) => Number(o !== m);
	    }

	    let oArray = original instanceof Array ? original : Array.from(original);
	    let mArray = modified instanceof Array ? modified : Array.from(modified);

	    if (oArray.length < mArray.length) {
	      let result = this._inferRecursive(mArray, oArray, (m, o) => costFn(o, m));

	      return new Alignment(result).inverse();
	    } else {
	      let result = this._inferRecursive(oArray, mArray, costFn);

	      return new Alignment(result);
	    }
	  }

	  static _inferRecursive(original, modified, costFn) {
	    if (original.length <= 1 || modified.length <= 1) {
	      return this._inferMatrix(original, modified, costFn);
	    }

	    const oMid = original.length >> 1;
	    const oLeft = original.slice(0, oMid);
	    const oRight = original.slice(oMid);

	    const lCosts = this._inferCosts(oLeft, modified, costFn);

	    const oRightRev = oRight.slice();
	    oRightRev.reverse();
	    const modifiedRev = modified.slice();
	    modifiedRev.reverse();

	    const rCosts = this._inferCosts(oRightRev, modifiedRev, costFn);

	    rCosts.reverse();
	    let mMid = -1,
	        best = Infinity;

	    for (let i = 0; i < lCosts.length; ++i) {
	      const score = lCosts[i] + rCosts[i];

	      if (score < best) {
	        mMid = i;
	        best = score;
	      }
	    }

	    const mLeft = modified.slice(0, mMid);
	    const mRight = modified.slice(mMid);

	    const left = this._inferRecursive(oLeft, mLeft, costFn);

	    const right = this._inferRecursive(oRight, mRight, costFn);

	    for (const [o, m] of right) {
	      left.push([o + oMid, m + mMid]);
	    }

	    return left;
	  }

	  static _inferCosts(original, modified, costFn) {
	    let row = [0];

	    for (let i = 0; i < modified.length; ++i) {
	      const cost = row[i] + costFn(undefined, modified[i]);
	      row.push(cost);
	    }

	    let prev = Array(row.length);
	    prev.fill(0);

	    for (const o of original) {
	      [prev, row] = [row, prev];
	      row[0] = prev[0] + costFn(o, undefined);

	      for (let i = 0; i < modified.length; ++i) {
	        const m = modified[i];
	        const subCost = prev[i] + costFn(o, m);
	        const delCost = prev[i + 1] + costFn(o, undefined);
	        const insCost = row[i] + costFn(undefined, m);
	        row[i + 1] = Math.min(subCost, delCost, insCost);
	      }
	    }

	    return row;
	  }

	  static _inferMatrix(original, modified, costFn) {
	    const row = [{
	      cost: 0,
	      i: -1,
	      j: -1
	    }];

	    for (let j = 0; j < modified.length; ++j) {
	      const m = modified[j];
	      row.push({
	        cost: row[j].cost + costFn(undefined, m),
	        i: 0,
	        j: j
	      });
	    }

	    const matrix = [row];

	    for (let i = 0; i < original.length; ++i) {
	      const o = original[i];
	      const prev = matrix[i];
	      const row = [{
	        cost: prev[0].cost + costFn(o, undefined),
	        i: i,
	        j: 0
	      }];

	      for (let j = 0; j < modified.length; ++j) {
	        const m = modified[j];
	        let cost = prev[j].cost + costFn(o, m);
	        let x = i,
	            y = j;
	        const delCost = prev[j + 1].cost + costFn(o, undefined);

	        if (delCost < cost) {
	          cost = delCost;
	          x = i;
	          y = j + 1;
	        }

	        const insCost = row[j].cost + costFn(undefined, m);

	        if (insCost < cost) {
	          cost = insCost;
	          x = i + 1;
	          y = j;
	        }

	        row.push({
	          cost: cost,
	          i: x,
	          j: y
	        });
	      }

	      matrix.push(row);
	    }

	    const result = [];
	    let i = matrix.length - 1;
	    let j = matrix[i].length - 1;

	    while (i >= 0) {
	      result.push([i, j]);
	      ({
	        i,
	        j
	      } = matrix[i][j]);
	    }

	    result.reverse();
	    return result;
	  }

	  slice(start, end) {
	    return new Alignment(this.values.slice(start, end));
	  }

	  _search(which, start, end) {
	    let first = 0,
	        limit = this.length;

	    while (first < limit) {
	      const mid = first + (limit - first >> 2);

	      if (this.values[mid][which] <= start) {
	        first = mid + 1;
	      } else {
	        limit = mid;
	      }
	    }

	    if (first === 0) {
	      throw new RangeError("Start index too small");
	    }

	    --first;
	    let last = first;
	    limit = this.length;

	    while (last < limit) {
	      const mid = last + (limit - last >> 2);

	      if (this.values[mid][which] < end) {
	        last = mid + 1;
	      } else {
	        limit = mid;
	      }
	    }

	    if (last === this.length) {
	      throw new RangeError("End index too large");
	    }

	    return [first, last];
	  }

	  _bounds(which, start, end) {
	    if (start === undefined) {
	      return [this.values[0][1 - which], this.values[this.length - 1][1 - which]];
	    } else if (typeof start !== "number") {
	      end = start[1];
	      start = start[0];
	    }

	    if (end === undefined) {
	      end = this.values[this.length - 1][which];
	    }

	    const [first, last] = this._search(which, start, end);

	    return [this.values[first][1 - which], this.values[last][1 - which]];
	  }

	  originalBounds(start, end) {
	    return this._bounds(1, start, end);
	  }

	  modifiedBounds(start, end) {
	    return this._bounds(0, start, end);
	  }

	  _sliceBy(which, start, end) {
	    if (typeof start !== "number") {
	      end = start[1];
	      start = start[0];
	    }

	    if (end === undefined) {
	      end = this.values[this.length - 1][which];
	    }

	    const [first, last] = this._search(which, start, end);

	    const values = this.values.slice(first, last + 1);

	    for (const i in values) {
	      const v = values[i].slice();
	      v[which] = Math.max(start, Math.min(v[which], end));
	      values[i] = v;
	    }

	    return new Alignment(values);
	  }

	  sliceByOriginal(start, end) {
	    return this._sliceBy(0, start, end);
	  }

	  sliceByModified(start, end) {
	    return this._sliceBy(1, start, end);
	  }

	  shift(deltaO, deltaM) {
	    const shifted = this.values.map(([o, m]) => [o + deltaO, m + deltaM]);
	    return new Alignment(shifted);
	  }

	  concat(...others) {
	    const values = this.values.slice();

	    for (const other of others) {
	      values.push(...other.values);
	    }

	    return new Alignment(values);
	  }

	  compose(other) {
	    const [mf, ml] = this.modifiedBounds();
	    const [of, ol] = other.originalBounds();

	    if (mf !== of || ml !== ol) {
	      throw new RangeError("Incompatible alignments");
	    }

	    const values = [];
	    let i = 0,
	        iMax = this.length;
	    let j = 0,
	        jMax = other.length;

	    while (i < iMax) {
	      while (this.values[i][1] > other.values[j][0]) {
	        ++j;
	      }

	      while (this.values[i][1] < other.values[j][0] && this.values[i + 1][1] <= other.values[j][0]) {
	        ++i;
	      }

	      values.push([this.values[i][0], other.values[j][1]]);

	      while (i + 1 < iMax && this.values[i][0] === this.values[i + 1][0]) {
	        ++i;
	      }

	      let needsUpper = false;

	      while (j + 1 < jMax && this.values[i][1] >= other.values[j + 1][0]) {
	        needsUpper = true;
	        ++j;
	      }

	      if (needsUpper) {
	        values.push([this.values[i][0], other.values[j][1]]);
	      }

	      ++i;
	    }

	    return new Alignment(values);
	  }

	  inverse() {
	    return new Alignment(this.values.map(([o, m]) => [m, o]));
	  }

	  equals(other) {
	    if (this.length != other.length) {
	      return false;
	    }

	    for (let i = 0; i < this.length; ++i) {
	      const [to, tm] = this.values[i];
	      const [oo, om] = other.values[i];

	      if (to != oo || tm != om) {
	        return false;
	      }
	    }

	    return true;
	  }

	}

	var commonjsGlobal$1 = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function createCommonjsModule$1(fn, module) {
	  return module = {
	    exports: {}
	  }, fn(module, module.exports), module.exports;
	}

	var O$1 = 'object';

	var check$1 = function (it) {
	  return it && it.Math == Math && it;
	}; // https://github.com/zloirock/core-js/issues/86#issuecomment-115759028


	var global_1$1 = // eslint-disable-next-line no-undef
	check$1(typeof globalThis == O$1 && globalThis) || check$1(typeof window == O$1 && window) || check$1(typeof self == O$1 && self) || check$1(typeof commonjsGlobal$1 == O$1 && commonjsGlobal$1) || // eslint-disable-next-line no-new-func
	Function('return this')();

	var fails$1 = function (exec) {
	  try {
	    return !!exec();
	  } catch (error) {
	    return true;
	  }
	}; // Thank's IE8 for his funny defineProperty


	var descriptors$1 = !fails$1(function () {
	  return Object.defineProperty({}, 'a', {
	    get: function () {
	      return 7;
	    }
	  }).a != 7;
	});

	var isObject$1 = function (it) {
	  return typeof it === 'object' ? it !== null : typeof it === 'function';
	};

	var document$2 = global_1$1.document; // typeof document.createElement is 'object' in old IE

	var EXISTS$1 = isObject$1(document$2) && isObject$1(document$2.createElement);

	var documentCreateElement$1 = function (it) {
	  return EXISTS$1 ? document$2.createElement(it) : {};
	}; // Thank's IE8 for his funny defineProperty


	var ie8DomDefine$1 = !descriptors$1 && !fails$1(function () {
	  return Object.defineProperty(documentCreateElement$1('div'), 'a', {
	    get: function () {
	      return 7;
	    }
	  }).a != 7;
	});

	var anObject$1 = function (it) {
	  if (!isObject$1(it)) {
	    throw TypeError(String(it) + ' is not an object');
	  }

	  return it;
	}; // `ToPrimitive` abstract operation
	// https://tc39.github.io/ecma262/#sec-toprimitive
	// instead of the ES6 spec version, we didn't implement @@toPrimitive case
	// and the second argument - flag - preferred type is a string


	var toPrimitive$1 = function (input, PREFERRED_STRING) {
	  if (!isObject$1(input)) return input;
	  var fn, val;
	  if (PREFERRED_STRING && typeof (fn = input.toString) == 'function' && !isObject$1(val = fn.call(input))) return val;
	  if (typeof (fn = input.valueOf) == 'function' && !isObject$1(val = fn.call(input))) return val;
	  if (!PREFERRED_STRING && typeof (fn = input.toString) == 'function' && !isObject$1(val = fn.call(input))) return val;
	  throw TypeError("Can't convert object to primitive value");
	};

	var nativeDefineProperty$1 = Object.defineProperty; // `Object.defineProperty` method
	// https://tc39.github.io/ecma262/#sec-object.defineproperty

	var f$6 = descriptors$1 ? nativeDefineProperty$1 : function defineProperty(O, P, Attributes) {
	  anObject$1(O);
	  P = toPrimitive$1(P, true);
	  anObject$1(Attributes);
	  if (ie8DomDefine$1) try {
	    return nativeDefineProperty$1(O, P, Attributes);
	  } catch (error) {
	    /* empty */
	  }
	  if ('get' in Attributes || 'set' in Attributes) throw TypeError('Accessors not supported');
	  if ('value' in Attributes) O[P] = Attributes.value;
	  return O;
	};
	var objectDefineProperty$1 = {
	  f: f$6
	};

	var createPropertyDescriptor$1 = function (bitmap, value) {
	  return {
	    enumerable: !(bitmap & 1),
	    configurable: !(bitmap & 2),
	    writable: !(bitmap & 4),
	    value: value
	  };
	};

	var hide$1 = descriptors$1 ? function (object, key, value) {
	  return objectDefineProperty$1.f(object, key, createPropertyDescriptor$1(1, value));
	} : function (object, key, value) {
	  object[key] = value;
	  return object;
	};

	var setGlobal$1 = function (key, value) {
	  try {
	    hide$1(global_1$1, key, value);
	  } catch (error) {
	    global_1$1[key] = value;
	  }

	  return value;
	};

	var isPure$1 = false;
	var shared$1 = createCommonjsModule$1(function (module) {
	  var SHARED = '__core-js_shared__';
	  var store = global_1$1[SHARED] || setGlobal$1(SHARED, {});
	  (module.exports = function (key, value) {
	    return store[key] || (store[key] = value !== undefined ? value : {});
	  })('versions', []).push({
	    version: '3.2.1',
	    mode: 'global',
	    copyright: '© 2019 Denis Pushkarev (zloirock.ru)'
	  });
	});
	var id$1 = 0;
	var postfix$1 = Math.random();

	var uid$1 = function (key) {
	  return 'Symbol(' + String(key === undefined ? '' : key) + ')_' + (++id$1 + postfix$1).toString(36);
	};

	var nativeSymbol$1 = !!Object.getOwnPropertySymbols && !fails$1(function () {
	  // Chrome 38 Symbol has incorrect toString conversion
	  // eslint-disable-next-line no-undef
	  return !String(Symbol());
	});
	var Symbol$1$1 = global_1$1.Symbol;
	var store$2 = shared$1('wks');

	var wellKnownSymbol$1 = function (name) {
	  return store$2[name] || (store$2[name] = nativeSymbol$1 && Symbol$1$1[name] || (nativeSymbol$1 ? Symbol$1$1 : uid$1)('Symbol.' + name));
	};

	var hasOwnProperty$1 = {}.hasOwnProperty;

	var has$2 = function (it, key) {
	  return hasOwnProperty$1.call(it, key);
	};

	var toString$1 = {}.toString;

	var classofRaw$1 = function (it) {
	  return toString$1.call(it).slice(8, -1);
	};

	var split$1 = ''.split; // fallback for non-array-like ES3 and non-enumerable old V8 strings

	var indexedObject$1 = fails$1(function () {
	  // throws an error in rhino, see https://github.com/mozilla/rhino/issues/346
	  // eslint-disable-next-line no-prototype-builtins
	  return !Object('z').propertyIsEnumerable(0);
	}) ? function (it) {
	  return classofRaw$1(it) == 'String' ? split$1.call(it, '') : Object(it);
	} : Object; // `RequireObjectCoercible` abstract operation
	// https://tc39.github.io/ecma262/#sec-requireobjectcoercible

	var requireObjectCoercible$1 = function (it) {
	  if (it == undefined) throw TypeError("Can't call method on " + it);
	  return it;
	}; // toObject with fallback for non-array-like ES3 strings


	var toIndexedObject$1 = function (it) {
	  return indexedObject$1(requireObjectCoercible$1(it));
	};

	var ceil$1 = Math.ceil;
	var floor$2 = Math.floor; // `ToInteger` abstract operation
	// https://tc39.github.io/ecma262/#sec-tointeger

	var toInteger$1 = function (argument) {
	  return isNaN(argument = +argument) ? 0 : (argument > 0 ? floor$2 : ceil$1)(argument);
	};

	var min$3 = Math.min; // `ToLength` abstract operation
	// https://tc39.github.io/ecma262/#sec-tolength

	var toLength$1 = function (argument) {
	  return argument > 0 ? min$3(toInteger$1(argument), 0x1FFFFFFFFFFFFF) : 0; // 2 ** 53 - 1 == 9007199254740991
	};

	var max$2 = Math.max;
	var min$1$1 = Math.min; // Helper for a popular repeating case of the spec:
	// Let integer be ? ToInteger(index).
	// If integer < 0, let result be max((length + integer), 0); else let result be min(length, length).

	var toAbsoluteIndex$1 = function (index, length) {
	  var integer = toInteger$1(index);
	  return integer < 0 ? max$2(integer + length, 0) : min$1$1(integer, length);
	}; // `Array.prototype.{ indexOf, includes }` methods implementation


	var createMethod$2 = function (IS_INCLUDES) {
	  return function ($this, el, fromIndex) {
	    var O = toIndexedObject$1($this);
	    var length = toLength$1(O.length);
	    var index = toAbsoluteIndex$1(fromIndex, length);
	    var value; // Array#includes uses SameValueZero equality algorithm
	    // eslint-disable-next-line no-self-compare

	    if (IS_INCLUDES && el != el) while (length > index) {
	      value = O[index++]; // eslint-disable-next-line no-self-compare

	      if (value != value) return true; // Array#indexOf ignores holes, Array#includes - not
	    } else for (; length > index; index++) {
	      if ((IS_INCLUDES || index in O) && O[index] === el) return IS_INCLUDES || index || 0;
	    }
	    return !IS_INCLUDES && -1;
	  };
	};

	var arrayIncludes$1 = {
	  // `Array.prototype.includes` method
	  // https://tc39.github.io/ecma262/#sec-array.prototype.includes
	  includes: createMethod$2(true),
	  // `Array.prototype.indexOf` method
	  // https://tc39.github.io/ecma262/#sec-array.prototype.indexof
	  indexOf: createMethod$2(false)
	};
	var hiddenKeys$2 = {};
	var indexOf$1 = arrayIncludes$1.indexOf;

	var objectKeysInternal$1 = function (object, names) {
	  var O = toIndexedObject$1(object);
	  var i = 0;
	  var result = [];
	  var key;

	  for (key in O) !has$2(hiddenKeys$2, key) && has$2(O, key) && result.push(key); // Don't enum bug & hidden keys


	  while (names.length > i) if (has$2(O, key = names[i++])) {
	    ~indexOf$1(result, key) || result.push(key);
	  }

	  return result;
	}; // IE8- don't enum bug keys


	var enumBugKeys$1 = ['constructor', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'toLocaleString', 'toString', 'valueOf']; // `Object.keys` method
	// https://tc39.github.io/ecma262/#sec-object.keys

	var objectKeys$1 = Object.keys || function keys(O) {
	  return objectKeysInternal$1(O, enumBugKeys$1);
	}; // `Object.defineProperties` method
	// https://tc39.github.io/ecma262/#sec-object.defineproperties


	var objectDefineProperties$1 = descriptors$1 ? Object.defineProperties : function defineProperties(O, Properties) {
	  anObject$1(O);
	  var keys = objectKeys$1(Properties);
	  var length = keys.length;
	  var index = 0;
	  var key;

	  while (length > index) objectDefineProperty$1.f(O, key = keys[index++], Properties[key]);

	  return O;
	};
	var path$1 = global_1$1;

	var aFunction$2 = function (variable) {
	  return typeof variable == 'function' ? variable : undefined;
	};

	var getBuiltIn$1 = function (namespace, method) {
	  return arguments.length < 2 ? aFunction$2(path$1[namespace]) || aFunction$2(global_1$1[namespace]) : path$1[namespace] && path$1[namespace][method] || global_1$1[namespace] && global_1$1[namespace][method];
	};

	var html$1 = getBuiltIn$1('document', 'documentElement');
	var keys$1 = shared$1('keys');

	var sharedKey$1 = function (key) {
	  return keys$1[key] || (keys$1[key] = uid$1(key));
	};

	var IE_PROTO$2 = sharedKey$1('IE_PROTO');
	var PROTOTYPE$1 = 'prototype';

	var Empty$1 = function () {
	  /* empty */
	}; // Create object with fake `null` prototype: use iframe Object with cleared prototype


	var createDict$1 = function () {
	  // Thrash, waste and sodomy: IE GC bug
	  var iframe = documentCreateElement$1('iframe');
	  var length = enumBugKeys$1.length;
	  var lt = '<';
	  var script = 'script';
	  var gt = '>';
	  var js = 'java' + script + ':';
	  var iframeDocument;
	  iframe.style.display = 'none';
	  html$1.appendChild(iframe);
	  iframe.src = String(js);
	  iframeDocument = iframe.contentWindow.document;
	  iframeDocument.open();
	  iframeDocument.write(lt + script + gt + 'document.F=Object' + lt + '/' + script + gt);
	  iframeDocument.close();
	  createDict$1 = iframeDocument.F;

	  while (length--) delete createDict$1[PROTOTYPE$1][enumBugKeys$1[length]];

	  return createDict$1();
	}; // `Object.create` method
	// https://tc39.github.io/ecma262/#sec-object.create


	var objectCreate$1 = Object.create || function create(O, Properties) {
	  var result;

	  if (O !== null) {
	    Empty$1[PROTOTYPE$1] = anObject$1(O);
	    result = new Empty$1();
	    Empty$1[PROTOTYPE$1] = null; // add "__proto__" for Object.getPrototypeOf polyfill

	    result[IE_PROTO$2] = O;
	  } else result = createDict$1();

	  return Properties === undefined ? result : objectDefineProperties$1(result, Properties);
	};

	hiddenKeys$2[IE_PROTO$2] = true;
	var UNSCOPABLES$1 = wellKnownSymbol$1('unscopables');
	var ArrayPrototype$1 = Array.prototype; // Array.prototype[@@unscopables]
	// https://tc39.github.io/ecma262/#sec-array.prototype-@@unscopables

	if (ArrayPrototype$1[UNSCOPABLES$1] == undefined) {
	  hide$1(ArrayPrototype$1, UNSCOPABLES$1, objectCreate$1(null));
	} // add a key to Array.prototype[@@unscopables]


	var addToUnscopables$1 = function (key) {
	  ArrayPrototype$1[UNSCOPABLES$1][key] = true;
	}; // this method was added to unscopables after implementation
	// in popular engines, so it's moved to a separate module


	addToUnscopables$1('flatMap');
	var f$1$1 = wellKnownSymbol$1;
	var wrappedWellKnownSymbol$1 = {
	  f: f$1$1
	};
	var defineProperty$3 = objectDefineProperty$1.f;

	var defineWellKnownSymbol$1 = function (NAME) {
	  var Symbol = path$1.Symbol || (path$1.Symbol = {});
	  if (!has$2(Symbol, NAME)) defineProperty$3(Symbol, NAME, {
	    value: wrappedWellKnownSymbol$1.f(NAME)
	  });
	}; // `Symbol.matchAll` well-known symbol


	defineWellKnownSymbol$1('matchAll');
	var nativePropertyIsEnumerable$1 = {}.propertyIsEnumerable;
	var getOwnPropertyDescriptor$2 = Object.getOwnPropertyDescriptor; // Nashorn ~ JDK8 bug

	var NASHORN_BUG$1 = getOwnPropertyDescriptor$2 && !nativePropertyIsEnumerable$1.call({
	  1: 2
	}, 1); // `Object.prototype.propertyIsEnumerable` method implementation
	// https://tc39.github.io/ecma262/#sec-object.prototype.propertyisenumerable

	var f$2$1 = NASHORN_BUG$1 ? function propertyIsEnumerable(V) {
	  var descriptor = getOwnPropertyDescriptor$2(this, V);
	  return !!descriptor && descriptor.enumerable;
	} : nativePropertyIsEnumerable$1;
	var objectPropertyIsEnumerable$1 = {
	  f: f$2$1
	};
	var nativeGetOwnPropertyDescriptor$1 = Object.getOwnPropertyDescriptor; // `Object.getOwnPropertyDescriptor` method
	// https://tc39.github.io/ecma262/#sec-object.getownpropertydescriptor

	var f$3$1 = descriptors$1 ? nativeGetOwnPropertyDescriptor$1 : function getOwnPropertyDescriptor(O, P) {
	  O = toIndexedObject$1(O);
	  P = toPrimitive$1(P, true);
	  if (ie8DomDefine$1) try {
	    return nativeGetOwnPropertyDescriptor$1(O, P);
	  } catch (error) {
	    /* empty */
	  }
	  if (has$2(O, P)) return createPropertyDescriptor$1(!objectPropertyIsEnumerable$1.f.call(O, P), O[P]);
	};
	var objectGetOwnPropertyDescriptor$1 = {
	  f: f$3$1
	};
	var functionToString$1 = shared$1('native-function-to-string', Function.toString);
	var WeakMap$2 = global_1$1.WeakMap;
	var nativeWeakMap$1 = typeof WeakMap$2 === 'function' && /native code/.test(functionToString$1.call(WeakMap$2));
	var WeakMap$1$1 = global_1$1.WeakMap;
	var set$1, get$1, has$1$1;

	var enforce$1 = function (it) {
	  return has$1$1(it) ? get$1(it) : set$1(it, {});
	};

	var getterFor$1 = function (TYPE) {
	  return function (it) {
	    var state;

	    if (!isObject$1(it) || (state = get$1(it)).type !== TYPE) {
	      throw TypeError('Incompatible receiver, ' + TYPE + ' required');
	    }

	    return state;
	  };
	};

	if (nativeWeakMap$1) {
	  var store$1$1 = new WeakMap$1$1();
	  var wmget$1 = store$1$1.get;
	  var wmhas$1 = store$1$1.has;
	  var wmset$1 = store$1$1.set;

	  set$1 = function (it, metadata) {
	    wmset$1.call(store$1$1, it, metadata);
	    return metadata;
	  };

	  get$1 = function (it) {
	    return wmget$1.call(store$1$1, it) || {};
	  };

	  has$1$1 = function (it) {
	    return wmhas$1.call(store$1$1, it);
	  };
	} else {
	  var STATE$1 = sharedKey$1('state');
	  hiddenKeys$2[STATE$1] = true;

	  set$1 = function (it, metadata) {
	    hide$1(it, STATE$1, metadata);
	    return metadata;
	  };

	  get$1 = function (it) {
	    return has$2(it, STATE$1) ? it[STATE$1] : {};
	  };

	  has$1$1 = function (it) {
	    return has$2(it, STATE$1);
	  };
	}

	var internalState$1 = {
	  set: set$1,
	  get: get$1,
	  has: has$1$1,
	  enforce: enforce$1,
	  getterFor: getterFor$1
	};
	var redefine$1 = createCommonjsModule$1(function (module) {
	  var getInternalState = internalState$1.get;
	  var enforceInternalState = internalState$1.enforce;
	  var TEMPLATE = String(functionToString$1).split('toString');
	  shared$1('inspectSource', function (it) {
	    return functionToString$1.call(it);
	  });
	  (module.exports = function (O, key, value, options) {
	    var unsafe = options ? !!options.unsafe : false;
	    var simple = options ? !!options.enumerable : false;
	    var noTargetGet = options ? !!options.noTargetGet : false;

	    if (typeof value == 'function') {
	      if (typeof key == 'string' && !has$2(value, 'name')) hide$1(value, 'name', key);
	      enforceInternalState(value).source = TEMPLATE.join(typeof key == 'string' ? key : '');
	    }

	    if (O === global_1$1) {
	      if (simple) O[key] = value;else setGlobal$1(key, value);
	      return;
	    } else if (!unsafe) {
	      delete O[key];
	    } else if (!noTargetGet && O[key]) {
	      simple = true;
	    }

	    if (simple) O[key] = value;else hide$1(O, key, value); // add fake Function#toString for correct work wrapped methods / constructors with methods like LoDash isNative
	  })(Function.prototype, 'toString', function toString() {
	    return typeof this == 'function' && getInternalState(this).source || functionToString$1.call(this);
	  });
	});
	var hiddenKeys$1$1 = enumBugKeys$1.concat('length', 'prototype'); // `Object.getOwnPropertyNames` method
	// https://tc39.github.io/ecma262/#sec-object.getownpropertynames

	var f$4$1 = Object.getOwnPropertyNames || function getOwnPropertyNames(O) {
	  return objectKeysInternal$1(O, hiddenKeys$1$1);
	};

	var objectGetOwnPropertyNames$1 = {
	  f: f$4$1
	};
	var f$5$1 = Object.getOwnPropertySymbols;
	var objectGetOwnPropertySymbols$1 = {
	  f: f$5$1
	}; // all object keys, includes non-enumerable and symbols

	var ownKeys$1 = getBuiltIn$1('Reflect', 'ownKeys') || function ownKeys(it) {
	  var keys = objectGetOwnPropertyNames$1.f(anObject$1(it));
	  var getOwnPropertySymbols = objectGetOwnPropertySymbols$1.f;
	  return getOwnPropertySymbols ? keys.concat(getOwnPropertySymbols(it)) : keys;
	};

	var copyConstructorProperties$1 = function (target, source) {
	  var keys = ownKeys$1(source);
	  var defineProperty = objectDefineProperty$1.f;
	  var getOwnPropertyDescriptor = objectGetOwnPropertyDescriptor$1.f;

	  for (var i = 0; i < keys.length; i++) {
	    var key = keys[i];
	    if (!has$2(target, key)) defineProperty(target, key, getOwnPropertyDescriptor(source, key));
	  }
	};

	var replacement$1 = /#|\.prototype\./;

	var isForced$1 = function (feature, detection) {
	  var value = data$1[normalize$1(feature)];
	  return value == POLYFILL$1 ? true : value == NATIVE$1 ? false : typeof detection == 'function' ? fails$1(detection) : !!detection;
	};

	var normalize$1 = isForced$1.normalize = function (string) {
	  return String(string).replace(replacement$1, '.').toLowerCase();
	};

	var data$1 = isForced$1.data = {};
	var NATIVE$1 = isForced$1.NATIVE = 'N';
	var POLYFILL$1 = isForced$1.POLYFILL = 'P';
	var isForced_1$1 = isForced$1;
	var getOwnPropertyDescriptor$1$1 = objectGetOwnPropertyDescriptor$1.f;
	/*
	  options.target      - name of the target object
	  options.global      - target is the global object
	  options.stat        - export as static methods of target
	  options.proto       - export as prototype methods of target
	  options.real        - real prototype method for the `pure` version
	  options.forced      - export even if the native feature is available
	  options.bind        - bind methods to the target, required for the `pure` version
	  options.wrap        - wrap constructors to preventing global pollution, required for the `pure` version
	  options.unsafe      - use the simple assignment of property instead of delete + defineProperty
	  options.sham        - add a flag to not completely full polyfills
	  options.enumerable  - export as enumerable property
	  options.noTargetGet - prevent calling a getter on target
	*/

	var _export$1 = function (options, source) {
	  var TARGET = options.target;
	  var GLOBAL = options.global;
	  var STATIC = options.stat;
	  var FORCED, target, key, targetProperty, sourceProperty, descriptor;

	  if (GLOBAL) {
	    target = global_1$1;
	  } else if (STATIC) {
	    target = global_1$1[TARGET] || setGlobal$1(TARGET, {});
	  } else {
	    target = (global_1$1[TARGET] || {}).prototype;
	  }

	  if (target) for (key in source) {
	    sourceProperty = source[key];

	    if (options.noTargetGet) {
	      descriptor = getOwnPropertyDescriptor$1$1(target, key);
	      targetProperty = descriptor && descriptor.value;
	    } else targetProperty = target[key];

	    FORCED = isForced_1$1(GLOBAL ? key : TARGET + (STATIC ? '.' : '#') + key, options.forced); // contained in target

	    if (!FORCED && targetProperty !== undefined) {
	      if (typeof sourceProperty === typeof targetProperty) continue;
	      copyConstructorProperties$1(sourceProperty, targetProperty);
	    } // add a flag to not completely full polyfills


	    if (options.sham || targetProperty && targetProperty.sham) {
	      hide$1(sourceProperty, 'sham', true);
	    } // extend global


	    redefine$1(target, key, sourceProperty, options);
	  }
	}; // `ToObject` abstract operation
	// https://tc39.github.io/ecma262/#sec-toobject


	var toObject$1 = function (argument) {
	  return Object(requireObjectCoercible$1(argument));
	};

	var correctPrototypeGetter$1 = !fails$1(function () {
	  function F() {
	    /* empty */
	  }

	  F.prototype.constructor = null;
	  return Object.getPrototypeOf(new F()) !== F.prototype;
	});
	var IE_PROTO$1$1 = sharedKey$1('IE_PROTO');
	var ObjectPrototype$1 = Object.prototype; // `Object.getPrototypeOf` method
	// https://tc39.github.io/ecma262/#sec-object.getprototypeof

	var objectGetPrototypeOf$1 = correctPrototypeGetter$1 ? Object.getPrototypeOf : function (O) {
	  O = toObject$1(O);
	  if (has$2(O, IE_PROTO$1$1)) return O[IE_PROTO$1$1];

	  if (typeof O.constructor == 'function' && O instanceof O.constructor) {
	    return O.constructor.prototype;
	  }

	  return O instanceof Object ? ObjectPrototype$1 : null;
	};
	var ITERATOR$3 = wellKnownSymbol$1('iterator');
	var BUGGY_SAFARI_ITERATORS$2 = false;

	var returnThis$2 = function () {
	  return this;
	}; // `%IteratorPrototype%` object
	// https://tc39.github.io/ecma262/#sec-%iteratorprototype%-object


	var IteratorPrototype$3, PrototypeOfArrayIteratorPrototype$1, arrayIterator$1;

	if ([].keys) {
	  arrayIterator$1 = [].keys(); // Safari 8 has buggy iterators w/o `next`

	  if (!('next' in arrayIterator$1)) BUGGY_SAFARI_ITERATORS$2 = true;else {
	    PrototypeOfArrayIteratorPrototype$1 = objectGetPrototypeOf$1(objectGetPrototypeOf$1(arrayIterator$1));
	    if (PrototypeOfArrayIteratorPrototype$1 !== Object.prototype) IteratorPrototype$3 = PrototypeOfArrayIteratorPrototype$1;
	  }
	}

	if (IteratorPrototype$3 == undefined) IteratorPrototype$3 = {}; // 25.1.2.1.1 %IteratorPrototype%[@@iterator]()

	if (!has$2(IteratorPrototype$3, ITERATOR$3)) hide$1(IteratorPrototype$3, ITERATOR$3, returnThis$2);
	var iteratorsCore$1 = {
	  IteratorPrototype: IteratorPrototype$3,
	  BUGGY_SAFARI_ITERATORS: BUGGY_SAFARI_ITERATORS$2
	};
	var defineProperty$1$1 = objectDefineProperty$1.f;
	var TO_STRING_TAG$3 = wellKnownSymbol$1('toStringTag');

	var setToStringTag$1 = function (it, TAG, STATIC) {
	  if (it && !has$2(it = STATIC ? it : it.prototype, TO_STRING_TAG$3)) {
	    defineProperty$1$1(it, TO_STRING_TAG$3, {
	      configurable: true,
	      value: TAG
	    });
	  }
	};

	var IteratorPrototype$1$1 = iteratorsCore$1.IteratorPrototype;

	var createIteratorConstructor$1 = function (IteratorConstructor, NAME, next) {
	  var TO_STRING_TAG = NAME + ' Iterator';
	  IteratorConstructor.prototype = objectCreate$1(IteratorPrototype$1$1, {
	    next: createPropertyDescriptor$1(1, next)
	  });
	  setToStringTag$1(IteratorConstructor, TO_STRING_TAG, false);
	  return IteratorConstructor;
	};

	var aFunction$1$1 = function (it) {
	  if (typeof it != 'function') {
	    throw TypeError(String(it) + ' is not a function');
	  }

	  return it;
	};

	var TO_STRING_TAG$1$1 = wellKnownSymbol$1('toStringTag'); // ES3 wrong here

	var CORRECT_ARGUMENTS$1 = classofRaw$1(function () {
	  return arguments;
	}()) == 'Arguments'; // fallback for IE11 Script Access Denied error

	var tryGet$1 = function (it, key) {
	  try {
	    return it[key];
	  } catch (error) {
	    /* empty */
	  }
	}; // getting tag from ES6+ `Object.prototype.toString`


	var classof$1 = function (it) {
	  var O, tag, result;
	  return it === undefined ? 'Undefined' : it === null ? 'Null' // @@toStringTag case
	  : typeof (tag = tryGet$1(O = Object(it), TO_STRING_TAG$1$1)) == 'string' ? tag // builtinTag case
	  : CORRECT_ARGUMENTS$1 ? classofRaw$1(O) // ES3 arguments fallback
	  : (result = classofRaw$1(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : result;
	}; // `RegExp.prototype.flags` getter implementation
	// https://tc39.github.io/ecma262/#sec-get-regexp.prototype.flags


	var regexpFlags$1 = function () {
	  var that = anObject$1(this);
	  var result = '';
	  if (that.global) result += 'g';
	  if (that.ignoreCase) result += 'i';
	  if (that.multiline) result += 'm';
	  if (that.dotAll) result += 's';
	  if (that.unicode) result += 'u';
	  if (that.sticky) result += 'y';
	  return result;
	};

	var SPECIES$3 = wellKnownSymbol$1('species'); // `SpeciesConstructor` abstract operation
	// https://tc39.github.io/ecma262/#sec-speciesconstructor

	var speciesConstructor$1 = function (O, defaultConstructor) {
	  var C = anObject$1(O).constructor;
	  var S;
	  return C === undefined || (S = anObject$1(C)[SPECIES$3]) == undefined ? defaultConstructor : aFunction$1$1(S);
	}; // `String.prototype.{ codePointAt, at }` methods implementation


	var createMethod$1$1 = function (CONVERT_TO_STRING) {
	  return function ($this, pos) {
	    var S = String(requireObjectCoercible$1($this));
	    var position = toInteger$1(pos);
	    var size = S.length;
	    var first, second;
	    if (position < 0 || position >= size) return CONVERT_TO_STRING ? '' : undefined;
	    first = S.charCodeAt(position);
	    return first < 0xD800 || first > 0xDBFF || position + 1 === size || (second = S.charCodeAt(position + 1)) < 0xDC00 || second > 0xDFFF ? CONVERT_TO_STRING ? S.charAt(position) : first : CONVERT_TO_STRING ? S.slice(position, position + 2) : (first - 0xD800 << 10) + (second - 0xDC00) + 0x10000;
	  };
	};

	var stringMultibyte$1 = {
	  // `String.prototype.codePointAt` method
	  // https://tc39.github.io/ecma262/#sec-string.prototype.codepointat
	  codeAt: createMethod$1$1(false),
	  // `String.prototype.at` method
	  // https://github.com/mathiasbynens/String.prototype.at
	  charAt: createMethod$1$1(true)
	};
	var charAt$1 = stringMultibyte$1.charAt; // `AdvanceStringIndex` abstract operation
	// https://tc39.github.io/ecma262/#sec-advancestringindex

	var advanceStringIndex$1 = function (S, index, unicode) {
	  return index + (unicode ? charAt$1(S, index).length : 1);
	};

	var MATCH_ALL$1 = wellKnownSymbol$1('matchAll');
	var REGEXP_STRING$1 = 'RegExp String';
	var REGEXP_STRING_ITERATOR$1 = REGEXP_STRING$1 + ' Iterator';
	var setInternalState$2 = internalState$1.set;
	var getInternalState$2 = internalState$1.getterFor(REGEXP_STRING_ITERATOR$1);
	var RegExpPrototype$1 = RegExp.prototype;
	var regExpBuiltinExec$1 = RegExpPrototype$1.exec;

	var regExpExec$1 = function (R, S) {
	  var exec = R.exec;
	  var result;

	  if (typeof exec == 'function') {
	    result = exec.call(R, S);
	    if (typeof result != 'object') throw TypeError('Incorrect exec result');
	    return result;
	  }

	  return regExpBuiltinExec$1.call(R, S);
	}; // eslint-disable-next-line max-len


	var $RegExpStringIterator$1 = createIteratorConstructor$1(function RegExpStringIterator(regexp, string, global, fullUnicode) {
	  setInternalState$2(this, {
	    type: REGEXP_STRING_ITERATOR$1,
	    regexp: regexp,
	    string: string,
	    global: global,
	    unicode: fullUnicode,
	    done: false
	  });
	}, REGEXP_STRING$1, function next() {
	  var state = getInternalState$2(this);
	  if (state.done) return {
	    value: undefined,
	    done: true
	  };
	  var R = state.regexp;
	  var S = state.string;
	  var match = regExpExec$1(R, S);
	  if (match === null) return {
	    value: undefined,
	    done: state.done = true
	  };

	  if (state.global) {
	    if (String(match[0]) == '') R.lastIndex = advanceStringIndex$1(S, toLength$1(R.lastIndex), state.unicode);
	    return {
	      value: match,
	      done: false
	    };
	  }

	  state.done = true;
	  return {
	    value: match,
	    done: false
	  };
	});

	var $matchAll$1 = function (string) {
	  var R = anObject$1(this);
	  var S = String(string);
	  var C, flagsValue, flags, matcher, global, fullUnicode;
	  C = speciesConstructor$1(R, RegExp);
	  flagsValue = R.flags;

	  if (flagsValue === undefined && R instanceof RegExp && !('flags' in RegExpPrototype$1)) {
	    flagsValue = regexpFlags$1.call(R);
	  }

	  flags = flagsValue === undefined ? '' : String(flagsValue);
	  matcher = new C(C === RegExp ? R.source : R, flags);
	  global = !!~flags.indexOf('g');
	  fullUnicode = !!~flags.indexOf('u');
	  matcher.lastIndex = toLength$1(R.lastIndex);
	  return new $RegExpStringIterator$1(matcher, S, global, fullUnicode);
	}; // `String.prototype.matchAll` method
	// https://github.com/tc39/proposal-string-matchall


	_export$1({
	  target: 'String',
	  proto: true
	}, {
	  matchAll: function matchAll(regexp) {
	    var O = requireObjectCoercible$1(this);
	    var S, matcher, rx;

	    if (regexp != null) {
	      matcher = regexp[MATCH_ALL$1];
	      if (matcher === undefined && isPure$1 && classof$1(regexp) == 'RegExp') matcher = $matchAll$1;
	      if (matcher != null) return aFunction$1$1(matcher).call(regexp, O);
	    }

	    S = String(O);
	    rx = new RegExp(regexp, 'g');
	    return rx[MATCH_ALL$1](S);
	  }
	});

	MATCH_ALL$1 in RegExpPrototype$1 || hide$1(RegExpPrototype$1, MATCH_ALL$1, $matchAll$1);
	/*!
	 * Copyright (c) Microsoft Corporation. All rights reserved.
	 * Licensed under the MIT license.
	 */

	function expandReplacement(replacement, match) {
	  const index = match.index;
	  const input = match.input;
	  let result = "";

	  for (let i = 0; i < replacement.length; ++i) {
	    const c = replacement[i];

	    if (c === "$" && i + 1 < replacement.length) {
	      let n = replacement[++i];

	      switch (n) {
	        case "$":
	          result += "$";
	          continue;

	        case "&":
	          result += match[0];
	          continue;

	        case "`":
	          result += input.slice(0, index);
	          continue;

	        case "'":
	          result += input.slice(index + match[0].length);
	          continue;
	      }

	      if ("0123456789".includes(n)) {
	        const n2 = replacement[i + 1];

	        if ("0123456789".includes(n2)) {
	          n += n2;
	          ++i;
	        }

	        const index = parseInt(n, 10);

	        if (index >= 1 && index < match.length) {
	          result += match[index];
	          continue;
	        }
	      }

	      result += c + n;
	    } else {
	      result += c;
	    }
	  }

	  return result;
	}

	function normalizeReplacer(replacement) {
	  if (typeof replacement === "string") {
	    return match => expandReplacement(replacement, match);
	  } else {
	    const replacer = replacement;
	    return match => replacer(...match, match.index, match.input);
	  }
	}

	function isStatefulRegExp(regexp) {
	  return regexp.global || regexp.sticky;
	}

	function cloneRegExp(regexp, addFlags = "", removeFlags = "") {
	  let flags = "";

	  for (const flag of regexp.flags) {
	    if (!removeFlags.includes(flag)) {
	      flags += flag;
	    }
	  }

	  for (const flag of addFlags) {
	    if (!flags.includes(flag)) {
	      flags += flag;
	    }
	  }

	  return new RegExp(regexp.source, flags);
	}
	/*!
	 * Copyright (c) Microsoft Corporation. All rights reserved.
	 * Licensed under the MIT license.
	 */


	class BiStringBuilder {
	  constructor(original) {
	    this._original = BiString.from(original);
	    this._modified = [];
	    this._alignment = [[0, 0]];
	    this._oPos = 0;
	    this._mPos = 0;
	  }

	  get original() {
	    return this._original.original;
	  }

	  get current() {
	    return this._original.modified;
	  }

	  get modified() {
	    return this._modified.join("");
	  }

	  get alignment() {
	    return new Alignment(this._alignment);
	  }

	  get position() {
	    return this._oPos;
	  }

	  get remaining() {
	    return this.current.length - this.position;
	  }

	  get isComplete() {
	    return this.remaining === 0;
	  }

	  peek(n) {
	    return this.current.slice(this._oPos, this._oPos + n);
	  }

	  _advance(oCount, mCount) {
	    this._oPos += oCount;
	    this._mPos += mCount;

	    if (oCount > 0 || mCount > 0) {
	      this._alignment.push([this._oPos, this._mPos]);
	    }
	  }

	  skip(n) {
	    if (n > 0) {
	      this._modified.push(this.peek(n));

	      for (let i = 0; i < n; ++i) {
	        this._advance(1, 1);
	      }
	    }
	  }

	  skipRest() {
	    this.skip(this.remaining);
	  }

	  insert(str) {
	    this.replace(0, str);
	  }

	  discard(n) {
	    this.replace(n, "");
	  }

	  discardRest() {
	    this.discard(this.remaining);
	  }

	  replace(n, str) {
	    if (typeof str === "string") {
	      if (str.length > 0) {
	        this._modified.push(str);
	      }

	      this._advance(n, str.length);
	    } else {
	      if (str.original !== this.peek(n)) {
	        throw new Error("BiString doesn't match the current string");
	      }

	      this._modified.push(str.modified);

	      const alignment = str.alignment.values;

	      for (let i = 1; i < alignment.length; ++i) {
	        const [o0, m0] = alignment[i - 1];
	        const [o1, m1] = alignment[i];

	        this._advance(o1 - o0, m1 - m0);
	      }
	    }
	  }

	  append(bs) {
	    this.replace(bs.original.length, bs);
	  }

	  _match(pattern) {
	    if (!isStatefulRegExp(pattern)) {
	      pattern = cloneRegExp(pattern, "g");
	    }

	    pattern.lastIndex = this.position;
	    return pattern.exec(this.current);
	  }

	  *_matchAll(pattern) {
	    if (pattern.global) {
	      pattern.lastIndex = this.position;
	      let match;

	      while (match = pattern.exec(this.current)) {
	        yield match;
	      }
	    } else {
	      if (!pattern.sticky) {
	        pattern = cloneRegExp(pattern, "g");
	      }

	      pattern.lastIndex = this.position;
	      let match;

	      if (match = pattern.exec(this.current)) {
	        yield match;
	      }
	    }
	  }

	  skipMatch(pattern) {
	    if (this._match(pattern)) {
	      this.skip(pattern.lastIndex - this.position);
	      return true;
	    } else {
	      return false;
	    }
	  }

	  discardMatch(pattern) {
	    const match = this._match(pattern);

	    if (match) {
	      this.skip(match.index - this.position);
	      this.discard(match[0].length);
	      return true;
	    } else {
	      return false;
	    }
	  }

	  replaceMatch(pattern, replacement) {
	    const replacer = normalizeReplacer(replacement);

	    const match = this._match(pattern);

	    if (match) {
	      this.skip(match.index - this.position);
	      this.replace(match[0].length, replacer(match));
	      return true;
	    } else {
	      return false;
	    }
	  }

	  replaceAll(pattern, replacement) {
	    const replacer = normalizeReplacer(replacement);

	    for (const match of this._matchAll(pattern)) {
	      this.skip(match.index - this.position);
	      this.replace(match[0].length, replacer(match));
	    }

	    this.skipRest();
	  }

	  build() {
	    if (!this.isComplete) {
	      throw new Error("The string is not completely built yet (".concat(this.remaining, " characters remaining)"));
	    }

	    const alignment = this._original.alignment.compose(this.alignment);

	    return new BiString(this.original, this.modified, alignment);
	  }

	  rewind() {
	    this._original = this.build();
	    this._modified = [];
	    this._alignment = [[0, 0]];
	    this._oPos = 0;
	    this._mPos = 0;
	  }

	}

	const CATEGORIES = ["Lu", "Ll", "Lt", "Lm", "Lo", "Mn", "Mc", "Me", "Nd", "Nl", "No", "Pc", "Pd", "Ps", "Pe", "Pi", "Pf", "Po", "Sm", "Sc", "Sk", "So", "Zs", "Zl", "Zp", "Cc", "Cf", "Cs", "Co", "Cn"];
	const CATEGORY_REGEXP = /([A-Z\xC0-\xD6\xD8-\xDE\u0100\u0102\u0104\u0106\u0108\u010A\u010C\u010E\u0110\u0112\u0114\u0116\u0118\u011A\u011C\u011E\u0120\u0122\u0124\u0126\u0128\u012A\u012C\u012E\u0130\u0132\u0134\u0136\u0139\u013B\u013D\u013F\u0141\u0143\u0145\u0147\u014A\u014C\u014E\u0150\u0152\u0154\u0156\u0158\u015A\u015C\u015E\u0160\u0162\u0164\u0166\u0168\u016A\u016C\u016E\u0170\u0172\u0174\u0176\u0178\u0179\u017B\u017D\u0181\u0182\u0184\u0186\u0187\u0189-\u018B\u018E-\u0191\u0193\u0194\u0196-\u0198\u019C\u019D\u019F\u01A0\u01A2\u01A4\u01A6\u01A7\u01A9\u01AC\u01AE\u01AF\u01B1-\u01B3\u01B5\u01B7\u01B8\u01BC\u01C4\u01C7\u01CA\u01CD\u01CF\u01D1\u01D3\u01D5\u01D7\u01D9\u01DB\u01DE\u01E0\u01E2\u01E4\u01E6\u01E8\u01EA\u01EC\u01EE\u01F1\u01F4\u01F6-\u01F8\u01FA\u01FC\u01FE\u0200\u0202\u0204\u0206\u0208\u020A\u020C\u020E\u0210\u0212\u0214\u0216\u0218\u021A\u021C\u021E\u0220\u0222\u0224\u0226\u0228\u022A\u022C\u022E\u0230\u0232\u023A\u023B\u023D\u023E\u0241\u0243-\u0246\u0248\u024A\u024C\u024E\u0370\u0372\u0376\u037F\u0386\u0388-\u038A\u038C\u038E\u038F\u0391-\u03A1\u03A3-\u03AB\u03CF\u03D2-\u03D4\u03D8\u03DA\u03DC\u03DE\u03E0\u03E2\u03E4\u03E6\u03E8\u03EA\u03EC\u03EE\u03F4\u03F7\u03F9\u03FA\u03FD-\u042F\u0460\u0462\u0464\u0466\u0468\u046A\u046C\u046E\u0470\u0472\u0474\u0476\u0478\u047A\u047C\u047E\u0480\u048A\u048C\u048E\u0490\u0492\u0494\u0496\u0498\u049A\u049C\u049E\u04A0\u04A2\u04A4\u04A6\u04A8\u04AA\u04AC\u04AE\u04B0\u04B2\u04B4\u04B6\u04B8\u04BA\u04BC\u04BE\u04C0\u04C1\u04C3\u04C5\u04C7\u04C9\u04CB\u04CD\u04D0\u04D2\u04D4\u04D6\u04D8\u04DA\u04DC\u04DE\u04E0\u04E2\u04E4\u04E6\u04E8\u04EA\u04EC\u04EE\u04F0\u04F2\u04F4\u04F6\u04F8\u04FA\u04FC\u04FE\u0500\u0502\u0504\u0506\u0508\u050A\u050C\u050E\u0510\u0512\u0514\u0516\u0518\u051A\u051C\u051E\u0520\u0522\u0524\u0526\u0528\u052A\u052C\u052E\u0531-\u0556\u10A0-\u10C5\u10C7\u10CD\u13A0-\u13F5\u1C90-\u1CBA\u1CBD-\u1CBF\u1E00\u1E02\u1E04\u1E06\u1E08\u1E0A\u1E0C\u1E0E\u1E10\u1E12\u1E14\u1E16\u1E18\u1E1A\u1E1C\u1E1E\u1E20\u1E22\u1E24\u1E26\u1E28\u1E2A\u1E2C\u1E2E\u1E30\u1E32\u1E34\u1E36\u1E38\u1E3A\u1E3C\u1E3E\u1E40\u1E42\u1E44\u1E46\u1E48\u1E4A\u1E4C\u1E4E\u1E50\u1E52\u1E54\u1E56\u1E58\u1E5A\u1E5C\u1E5E\u1E60\u1E62\u1E64\u1E66\u1E68\u1E6A\u1E6C\u1E6E\u1E70\u1E72\u1E74\u1E76\u1E78\u1E7A\u1E7C\u1E7E\u1E80\u1E82\u1E84\u1E86\u1E88\u1E8A\u1E8C\u1E8E\u1E90\u1E92\u1E94\u1E9E\u1EA0\u1EA2\u1EA4\u1EA6\u1EA8\u1EAA\u1EAC\u1EAE\u1EB0\u1EB2\u1EB4\u1EB6\u1EB8\u1EBA\u1EBC\u1EBE\u1EC0\u1EC2\u1EC4\u1EC6\u1EC8\u1ECA\u1ECC\u1ECE\u1ED0\u1ED2\u1ED4\u1ED6\u1ED8\u1EDA\u1EDC\u1EDE\u1EE0\u1EE2\u1EE4\u1EE6\u1EE8\u1EEA\u1EEC\u1EEE\u1EF0\u1EF2\u1EF4\u1EF6\u1EF8\u1EFA\u1EFC\u1EFE\u1F08-\u1F0F\u1F18-\u1F1D\u1F28-\u1F2F\u1F38-\u1F3F\u1F48-\u1F4D\u1F59\u1F5B\u1F5D\u1F5F\u1F68-\u1F6F\u1FB8-\u1FBB\u1FC8-\u1FCB\u1FD8-\u1FDB\u1FE8-\u1FEC\u1FF8-\u1FFB\u2102\u2107\u210B-\u210D\u2110-\u2112\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u2130-\u2133\u213E\u213F\u2145\u2183\u2C00-\u2C2E\u2C60\u2C62-\u2C64\u2C67\u2C69\u2C6B\u2C6D-\u2C70\u2C72\u2C75\u2C7E-\u2C80\u2C82\u2C84\u2C86\u2C88\u2C8A\u2C8C\u2C8E\u2C90\u2C92\u2C94\u2C96\u2C98\u2C9A\u2C9C\u2C9E\u2CA0\u2CA2\u2CA4\u2CA6\u2CA8\u2CAA\u2CAC\u2CAE\u2CB0\u2CB2\u2CB4\u2CB6\u2CB8\u2CBA\u2CBC\u2CBE\u2CC0\u2CC2\u2CC4\u2CC6\u2CC8\u2CCA\u2CCC\u2CCE\u2CD0\u2CD2\u2CD4\u2CD6\u2CD8\u2CDA\u2CDC\u2CDE\u2CE0\u2CE2\u2CEB\u2CED\u2CF2\uA640\uA642\uA644\uA646\uA648\uA64A\uA64C\uA64E\uA650\uA652\uA654\uA656\uA658\uA65A\uA65C\uA65E\uA660\uA662\uA664\uA666\uA668\uA66A\uA66C\uA680\uA682\uA684\uA686\uA688\uA68A\uA68C\uA68E\uA690\uA692\uA694\uA696\uA698\uA69A\uA722\uA724\uA726\uA728\uA72A\uA72C\uA72E\uA732\uA734\uA736\uA738\uA73A\uA73C\uA73E\uA740\uA742\uA744\uA746\uA748\uA74A\uA74C\uA74E\uA750\uA752\uA754\uA756\uA758\uA75A\uA75C\uA75E\uA760\uA762\uA764\uA766\uA768\uA76A\uA76C\uA76E\uA779\uA77B\uA77D\uA77E\uA780\uA782\uA784\uA786\uA78B\uA78D\uA790\uA792\uA796\uA798\uA79A\uA79C\uA79E\uA7A0\uA7A2\uA7A4\uA7A6\uA7A8\uA7AA-\uA7AE\uA7B0-\uA7B4\uA7B6\uA7B8\uA7BA\uA7BC\uA7BE\uA7C2\uA7C4-\uA7C6\uFF21-\uFF3A\u{10400}-\u{10427}\u{104B0}-\u{104D3}\u{10C80}-\u{10CB2}\u{118A0}-\u{118BF}\u{16E40}-\u{16E5F}\u{1D400}-\u{1D419}\u{1D434}-\u{1D44D}\u{1D468}-\u{1D481}\u{1D49C}\u{1D49E}\u{1D49F}\u{1D4A2}\u{1D4A5}\u{1D4A6}\u{1D4A9}-\u{1D4AC}\u{1D4AE}-\u{1D4B5}\u{1D4D0}-\u{1D4E9}\u{1D504}\u{1D505}\u{1D507}-\u{1D50A}\u{1D50D}-\u{1D514}\u{1D516}-\u{1D51C}\u{1D538}\u{1D539}\u{1D53B}-\u{1D53E}\u{1D540}-\u{1D544}\u{1D546}\u{1D54A}-\u{1D550}\u{1D56C}-\u{1D585}\u{1D5A0}-\u{1D5B9}\u{1D5D4}-\u{1D5ED}\u{1D608}-\u{1D621}\u{1D63C}-\u{1D655}\u{1D670}-\u{1D689}\u{1D6A8}-\u{1D6C0}\u{1D6E2}-\u{1D6FA}\u{1D71C}-\u{1D734}\u{1D756}-\u{1D76E}\u{1D790}-\u{1D7A8}\u{1D7CA}\u{1E900}-\u{1E921}])|([a-z\xB5\xDF-\xF6\xF8-\xFF\u0101\u0103\u0105\u0107\u0109\u010B\u010D\u010F\u0111\u0113\u0115\u0117\u0119\u011B\u011D\u011F\u0121\u0123\u0125\u0127\u0129\u012B\u012D\u012F\u0131\u0133\u0135\u0137\u0138\u013A\u013C\u013E\u0140\u0142\u0144\u0146\u0148\u0149\u014B\u014D\u014F\u0151\u0153\u0155\u0157\u0159\u015B\u015D\u015F\u0161\u0163\u0165\u0167\u0169\u016B\u016D\u016F\u0171\u0173\u0175\u0177\u017A\u017C\u017E-\u0180\u0183\u0185\u0188\u018C\u018D\u0192\u0195\u0199-\u019B\u019E\u01A1\u01A3\u01A5\u01A8\u01AA\u01AB\u01AD\u01B0\u01B4\u01B6\u01B9\u01BA\u01BD-\u01BF\u01C6\u01C9\u01CC\u01CE\u01D0\u01D2\u01D4\u01D6\u01D8\u01DA\u01DC\u01DD\u01DF\u01E1\u01E3\u01E5\u01E7\u01E9\u01EB\u01ED\u01EF\u01F0\u01F3\u01F5\u01F9\u01FB\u01FD\u01FF\u0201\u0203\u0205\u0207\u0209\u020B\u020D\u020F\u0211\u0213\u0215\u0217\u0219\u021B\u021D\u021F\u0221\u0223\u0225\u0227\u0229\u022B\u022D\u022F\u0231\u0233-\u0239\u023C\u023F\u0240\u0242\u0247\u0249\u024B\u024D\u024F-\u0293\u0295-\u02AF\u0371\u0373\u0377\u037B-\u037D\u0390\u03AC-\u03CE\u03D0\u03D1\u03D5-\u03D7\u03D9\u03DB\u03DD\u03DF\u03E1\u03E3\u03E5\u03E7\u03E9\u03EB\u03ED\u03EF-\u03F3\u03F5\u03F8\u03FB\u03FC\u0430-\u045F\u0461\u0463\u0465\u0467\u0469\u046B\u046D\u046F\u0471\u0473\u0475\u0477\u0479\u047B\u047D\u047F\u0481\u048B\u048D\u048F\u0491\u0493\u0495\u0497\u0499\u049B\u049D\u049F\u04A1\u04A3\u04A5\u04A7\u04A9\u04AB\u04AD\u04AF\u04B1\u04B3\u04B5\u04B7\u04B9\u04BB\u04BD\u04BF\u04C2\u04C4\u04C6\u04C8\u04CA\u04CC\u04CE\u04CF\u04D1\u04D3\u04D5\u04D7\u04D9\u04DB\u04DD\u04DF\u04E1\u04E3\u04E5\u04E7\u04E9\u04EB\u04ED\u04EF\u04F1\u04F3\u04F5\u04F7\u04F9\u04FB\u04FD\u04FF\u0501\u0503\u0505\u0507\u0509\u050B\u050D\u050F\u0511\u0513\u0515\u0517\u0519\u051B\u051D\u051F\u0521\u0523\u0525\u0527\u0529\u052B\u052D\u052F\u0560-\u0588\u10D0-\u10FA\u10FD-\u10FF\u13F8-\u13FD\u1C80-\u1C88\u1D00-\u1D2B\u1D6B-\u1D77\u1D79-\u1D9A\u1E01\u1E03\u1E05\u1E07\u1E09\u1E0B\u1E0D\u1E0F\u1E11\u1E13\u1E15\u1E17\u1E19\u1E1B\u1E1D\u1E1F\u1E21\u1E23\u1E25\u1E27\u1E29\u1E2B\u1E2D\u1E2F\u1E31\u1E33\u1E35\u1E37\u1E39\u1E3B\u1E3D\u1E3F\u1E41\u1E43\u1E45\u1E47\u1E49\u1E4B\u1E4D\u1E4F\u1E51\u1E53\u1E55\u1E57\u1E59\u1E5B\u1E5D\u1E5F\u1E61\u1E63\u1E65\u1E67\u1E69\u1E6B\u1E6D\u1E6F\u1E71\u1E73\u1E75\u1E77\u1E79\u1E7B\u1E7D\u1E7F\u1E81\u1E83\u1E85\u1E87\u1E89\u1E8B\u1E8D\u1E8F\u1E91\u1E93\u1E95-\u1E9D\u1E9F\u1EA1\u1EA3\u1EA5\u1EA7\u1EA9\u1EAB\u1EAD\u1EAF\u1EB1\u1EB3\u1EB5\u1EB7\u1EB9\u1EBB\u1EBD\u1EBF\u1EC1\u1EC3\u1EC5\u1EC7\u1EC9\u1ECB\u1ECD\u1ECF\u1ED1\u1ED3\u1ED5\u1ED7\u1ED9\u1EDB\u1EDD\u1EDF\u1EE1\u1EE3\u1EE5\u1EE7\u1EE9\u1EEB\u1EED\u1EEF\u1EF1\u1EF3\u1EF5\u1EF7\u1EF9\u1EFB\u1EFD\u1EFF-\u1F07\u1F10-\u1F15\u1F20-\u1F27\u1F30-\u1F37\u1F40-\u1F45\u1F50-\u1F57\u1F60-\u1F67\u1F70-\u1F7D\u1F80-\u1F87\u1F90-\u1F97\u1FA0-\u1FA7\u1FB0-\u1FB4\u1FB6\u1FB7\u1FBE\u1FC2-\u1FC4\u1FC6\u1FC7\u1FD0-\u1FD3\u1FD6\u1FD7\u1FE0-\u1FE7\u1FF2-\u1FF4\u1FF6\u1FF7\u210A\u210E\u210F\u2113\u212F\u2134\u2139\u213C\u213D\u2146-\u2149\u214E\u2184\u2C30-\u2C5E\u2C61\u2C65\u2C66\u2C68\u2C6A\u2C6C\u2C71\u2C73\u2C74\u2C76-\u2C7B\u2C81\u2C83\u2C85\u2C87\u2C89\u2C8B\u2C8D\u2C8F\u2C91\u2C93\u2C95\u2C97\u2C99\u2C9B\u2C9D\u2C9F\u2CA1\u2CA3\u2CA5\u2CA7\u2CA9\u2CAB\u2CAD\u2CAF\u2CB1\u2CB3\u2CB5\u2CB7\u2CB9\u2CBB\u2CBD\u2CBF\u2CC1\u2CC3\u2CC5\u2CC7\u2CC9\u2CCB\u2CCD\u2CCF\u2CD1\u2CD3\u2CD5\u2CD7\u2CD9\u2CDB\u2CDD\u2CDF\u2CE1\u2CE3\u2CE4\u2CEC\u2CEE\u2CF3\u2D00-\u2D25\u2D27\u2D2D\uA641\uA643\uA645\uA647\uA649\uA64B\uA64D\uA64F\uA651\uA653\uA655\uA657\uA659\uA65B\uA65D\uA65F\uA661\uA663\uA665\uA667\uA669\uA66B\uA66D\uA681\uA683\uA685\uA687\uA689\uA68B\uA68D\uA68F\uA691\uA693\uA695\uA697\uA699\uA69B\uA723\uA725\uA727\uA729\uA72B\uA72D\uA72F-\uA731\uA733\uA735\uA737\uA739\uA73B\uA73D\uA73F\uA741\uA743\uA745\uA747\uA749\uA74B\uA74D\uA74F\uA751\uA753\uA755\uA757\uA759\uA75B\uA75D\uA75F\uA761\uA763\uA765\uA767\uA769\uA76B\uA76D\uA76F\uA771-\uA778\uA77A\uA77C\uA77F\uA781\uA783\uA785\uA787\uA78C\uA78E\uA791\uA793-\uA795\uA797\uA799\uA79B\uA79D\uA79F\uA7A1\uA7A3\uA7A5\uA7A7\uA7A9\uA7AF\uA7B5\uA7B7\uA7B9\uA7BB\uA7BD\uA7BF\uA7C3\uA7FA\uAB30-\uAB5A\uAB60-\uAB67\uAB70-\uABBF\uFB00-\uFB06\uFB13-\uFB17\uFF41-\uFF5A\u{10428}-\u{1044F}\u{104D8}-\u{104FB}\u{10CC0}-\u{10CF2}\u{118C0}-\u{118DF}\u{16E60}-\u{16E7F}\u{1D41A}-\u{1D433}\u{1D44E}-\u{1D454}\u{1D456}-\u{1D467}\u{1D482}-\u{1D49B}\u{1D4B6}-\u{1D4B9}\u{1D4BB}\u{1D4BD}-\u{1D4C3}\u{1D4C5}-\u{1D4CF}\u{1D4EA}-\u{1D503}\u{1D51E}-\u{1D537}\u{1D552}-\u{1D56B}\u{1D586}-\u{1D59F}\u{1D5BA}-\u{1D5D3}\u{1D5EE}-\u{1D607}\u{1D622}-\u{1D63B}\u{1D656}-\u{1D66F}\u{1D68A}-\u{1D6A5}\u{1D6C2}-\u{1D6DA}\u{1D6DC}-\u{1D6E1}\u{1D6FC}-\u{1D714}\u{1D716}-\u{1D71B}\u{1D736}-\u{1D74E}\u{1D750}-\u{1D755}\u{1D770}-\u{1D788}\u{1D78A}-\u{1D78F}\u{1D7AA}-\u{1D7C2}\u{1D7C4}-\u{1D7C9}\u{1D7CB}\u{1E922}-\u{1E943}])|([\u01C5\u01C8\u01CB\u01F2\u1F88-\u1F8F\u1F98-\u1F9F\u1FA8-\u1FAF\u1FBC\u1FCC\u1FFC])|([\u02B0-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0374\u037A\u0559\u0640\u06E5\u06E6\u07F4\u07F5\u07FA\u081A\u0824\u0828\u0971\u0E46\u0EC6\u10FC\u17D7\u1843\u1AA7\u1C78-\u1C7D\u1D2C-\u1D6A\u1D78\u1D9B-\u1DBF\u2071\u207F\u2090-\u209C\u2C7C\u2C7D\u2D6F\u2E2F\u3005\u3031-\u3035\u303B\u309D\u309E\u30FC-\u30FE\uA015\uA4F8-\uA4FD\uA60C\uA67F\uA69C\uA69D\uA717-\uA71F\uA770\uA788\uA7F8\uA7F9\uA9CF\uA9E6\uAA70\uAADD\uAAF3\uAAF4\uAB5C-\uAB5F\uFF70\uFF9E\uFF9F\u{16B40}-\u{16B43}\u{16F93}-\u{16F9F}\u{16FE0}\u{16FE1}\u{16FE3}\u{1E137}-\u{1E13D}\u{1E94B}])|([\xAA\xBA\u01BB\u01C0-\u01C3\u0294\u05D0-\u05EA\u05EF-\u05F2\u0620-\u063F\u0641-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u0800-\u0815\u0840-\u0858\u0860-\u086A\u08A0-\u08B4\u08B6-\u08BD\u0904-\u0939\u093D\u0950\u0958-\u0961\u0972-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u09FC\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60\u0C61\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E45\u0E81\u0E82\u0E84\u0E86-\u0E8A\u0E8C-\u0EA3\u0EA5\u0EA7-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u1100-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16F1-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17DC\u1820-\u1842\u1844-\u1878\u1880-\u1884\u1887-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C77\u1CE9-\u1CEC\u1CEE-\u1CF3\u1CF5\u1CF6\u1CFA\u2135-\u2138\u2D30-\u2D67\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u3006\u303C\u3041-\u3096\u309F\u30A1-\u30FA\u30FF\u3105-\u312F\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FEF\uA000-\uA014\uA016-\uA48C\uA4D0-\uA4F7\uA500-\uA60B\uA610-\uA61F\uA62A\uA62B\uA66E\uA6A0-\uA6E5\uA78F\uA7F7\uA7FB-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA8FE\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9E0-\uA9E4\uA9E7-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA6F\uAA71-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB\uAADC\uAAE0-\uAAEA\uAAF2\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF66-\uFF6F\uFF71-\uFF9D\uFFA0-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC\u{10000}-\u{1000B}\u{1000D}-\u{10026}\u{10028}-\u{1003A}\u{1003C}\u{1003D}\u{1003F}-\u{1004D}\u{10050}-\u{1005D}\u{10080}-\u{100FA}\u{10280}-\u{1029C}\u{102A0}-\u{102D0}\u{10300}-\u{1031F}\u{1032D}-\u{10340}\u{10342}-\u{10349}\u{10350}-\u{10375}\u{10380}-\u{1039D}\u{103A0}-\u{103C3}\u{103C8}-\u{103CF}\u{10450}-\u{1049D}\u{10500}-\u{10527}\u{10530}-\u{10563}\u{10600}-\u{10736}\u{10740}-\u{10755}\u{10760}-\u{10767}\u{10800}-\u{10805}\u{10808}\u{1080A}-\u{10835}\u{10837}\u{10838}\u{1083C}\u{1083F}-\u{10855}\u{10860}-\u{10876}\u{10880}-\u{1089E}\u{108E0}-\u{108F2}\u{108F4}\u{108F5}\u{10900}-\u{10915}\u{10920}-\u{10939}\u{10980}-\u{109B7}\u{109BE}\u{109BF}\u{10A00}\u{10A10}-\u{10A13}\u{10A15}-\u{10A17}\u{10A19}-\u{10A35}\u{10A60}-\u{10A7C}\u{10A80}-\u{10A9C}\u{10AC0}-\u{10AC7}\u{10AC9}-\u{10AE4}\u{10B00}-\u{10B35}\u{10B40}-\u{10B55}\u{10B60}-\u{10B72}\u{10B80}-\u{10B91}\u{10C00}-\u{10C48}\u{10D00}-\u{10D23}\u{10F00}-\u{10F1C}\u{10F27}\u{10F30}-\u{10F45}\u{10FE0}-\u{10FF6}\u{11003}-\u{11037}\u{11083}-\u{110AF}\u{110D0}-\u{110E8}\u{11103}-\u{11126}\u{11144}\u{11150}-\u{11172}\u{11176}\u{11183}-\u{111B2}\u{111C1}-\u{111C4}\u{111DA}\u{111DC}\u{11200}-\u{11211}\u{11213}-\u{1122B}\u{11280}-\u{11286}\u{11288}\u{1128A}-\u{1128D}\u{1128F}-\u{1129D}\u{1129F}-\u{112A8}\u{112B0}-\u{112DE}\u{11305}-\u{1130C}\u{1130F}\u{11310}\u{11313}-\u{11328}\u{1132A}-\u{11330}\u{11332}\u{11333}\u{11335}-\u{11339}\u{1133D}\u{11350}\u{1135D}-\u{11361}\u{11400}-\u{11434}\u{11447}-\u{1144A}\u{1145F}\u{11480}-\u{114AF}\u{114C4}\u{114C5}\u{114C7}\u{11580}-\u{115AE}\u{115D8}-\u{115DB}\u{11600}-\u{1162F}\u{11644}\u{11680}-\u{116AA}\u{116B8}\u{11700}-\u{1171A}\u{11800}-\u{1182B}\u{118FF}\u{119A0}-\u{119A7}\u{119AA}-\u{119D0}\u{119E1}\u{119E3}\u{11A00}\u{11A0B}-\u{11A32}\u{11A3A}\u{11A50}\u{11A5C}-\u{11A89}\u{11A9D}\u{11AC0}-\u{11AF8}\u{11C00}-\u{11C08}\u{11C0A}-\u{11C2E}\u{11C40}\u{11C72}-\u{11C8F}\u{11D00}-\u{11D06}\u{11D08}\u{11D09}\u{11D0B}-\u{11D30}\u{11D46}\u{11D60}-\u{11D65}\u{11D67}\u{11D68}\u{11D6A}-\u{11D89}\u{11D98}\u{11EE0}-\u{11EF2}\u{12000}-\u{12399}\u{12480}-\u{12543}\u{13000}-\u{1342E}\u{14400}-\u{14646}\u{16800}-\u{16A38}\u{16A40}-\u{16A5E}\u{16AD0}-\u{16AED}\u{16B00}-\u{16B2F}\u{16B63}-\u{16B77}\u{16B7D}-\u{16B8F}\u{16F00}-\u{16F4A}\u{16F50}\u{17000}-\u{187F7}\u{18800}-\u{18AF2}\u{1B000}-\u{1B11E}\u{1B150}-\u{1B152}\u{1B164}-\u{1B167}\u{1B170}-\u{1B2FB}\u{1BC00}-\u{1BC6A}\u{1BC70}-\u{1BC7C}\u{1BC80}-\u{1BC88}\u{1BC90}-\u{1BC99}\u{1E100}-\u{1E12C}\u{1E14E}\u{1E2C0}-\u{1E2EB}\u{1E800}-\u{1E8C4}\u{1EE00}-\u{1EE03}\u{1EE05}-\u{1EE1F}\u{1EE21}\u{1EE22}\u{1EE24}\u{1EE27}\u{1EE29}-\u{1EE32}\u{1EE34}-\u{1EE37}\u{1EE39}\u{1EE3B}\u{1EE42}\u{1EE47}\u{1EE49}\u{1EE4B}\u{1EE4D}-\u{1EE4F}\u{1EE51}\u{1EE52}\u{1EE54}\u{1EE57}\u{1EE59}\u{1EE5B}\u{1EE5D}\u{1EE5F}\u{1EE61}\u{1EE62}\u{1EE64}\u{1EE67}-\u{1EE6A}\u{1EE6C}-\u{1EE72}\u{1EE74}-\u{1EE77}\u{1EE79}-\u{1EE7C}\u{1EE7E}\u{1EE80}-\u{1EE89}\u{1EE8B}-\u{1EE9B}\u{1EEA1}-\u{1EEA3}\u{1EEA5}-\u{1EEA9}\u{1EEAB}-\u{1EEBB}\u{20000}-\u{2A6D6}\u{2A700}-\u{2B734}\u{2B740}-\u{2B81D}\u{2B820}-\u{2CEA1}\u{2CEB0}-\u{2EBE0}\u{2F800}-\u{2FA1D}])|([\u0300-\u036F\u0483-\u0487\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u0711\u0730-\u074A\u07A6-\u07B0\u07EB-\u07F3\u07FD\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u08D3-\u08E1\u08E3-\u0902\u093A\u093C\u0941-\u0948\u094D\u0951-\u0957\u0962\u0963\u0981\u09BC\u09C1-\u09C4\u09CD\u09E2\u09E3\u09FE\u0A01\u0A02\u0A3C\u0A41\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A70\u0A71\u0A75\u0A81\u0A82\u0ABC\u0AC1-\u0AC5\u0AC7\u0AC8\u0ACD\u0AE2\u0AE3\u0AFA-\u0AFF\u0B01\u0B3C\u0B3F\u0B41-\u0B44\u0B4D\u0B56\u0B62\u0B63\u0B82\u0BC0\u0BCD\u0C00\u0C04\u0C3E-\u0C40\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C62\u0C63\u0C81\u0CBC\u0CBF\u0CC6\u0CCC\u0CCD\u0CE2\u0CE3\u0D00\u0D01\u0D3B\u0D3C\u0D41-\u0D44\u0D4D\u0D62\u0D63\u0DCA\u0DD2-\u0DD4\u0DD6\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0EB1\u0EB4-\u0EBC\u0EC8-\u0ECD\u0F18\u0F19\u0F35\u0F37\u0F39\u0F71-\u0F7E\u0F80-\u0F84\u0F86\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u102D-\u1030\u1032-\u1037\u1039\u103A\u103D\u103E\u1058\u1059\u105E-\u1060\u1071-\u1074\u1082\u1085\u1086\u108D\u109D\u135D-\u135F\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17B4\u17B5\u17B7-\u17BD\u17C6\u17C9-\u17D3\u17DD\u180B-\u180D\u1885\u1886\u18A9\u1920-\u1922\u1927\u1928\u1932\u1939-\u193B\u1A17\u1A18\u1A1B\u1A56\u1A58-\u1A5E\u1A60\u1A62\u1A65-\u1A6C\u1A73-\u1A7C\u1A7F\u1AB0-\u1ABD\u1B00-\u1B03\u1B34\u1B36-\u1B3A\u1B3C\u1B42\u1B6B-\u1B73\u1B80\u1B81\u1BA2-\u1BA5\u1BA8\u1BA9\u1BAB-\u1BAD\u1BE6\u1BE8\u1BE9\u1BED\u1BEF-\u1BF1\u1C2C-\u1C33\u1C36\u1C37\u1CD0-\u1CD2\u1CD4-\u1CE0\u1CE2-\u1CE8\u1CED\u1CF4\u1CF8\u1CF9\u1DC0-\u1DF9\u1DFB-\u1DFF\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302D\u3099\u309A\uA66F\uA674-\uA67D\uA69E\uA69F\uA6F0\uA6F1\uA802\uA806\uA80B\uA825\uA826\uA8C4\uA8C5\uA8E0-\uA8F1\uA8FF\uA926-\uA92D\uA947-\uA951\uA980-\uA982\uA9B3\uA9B6-\uA9B9\uA9BC\uA9BD\uA9E5\uAA29-\uAA2E\uAA31\uAA32\uAA35\uAA36\uAA43\uAA4C\uAA7C\uAAB0\uAAB2-\uAAB4\uAAB7\uAAB8\uAABE\uAABF\uAAC1\uAAEC\uAAED\uAAF6\uABE5\uABE8\uABED\uFB1E\uFE00-\uFE0F\uFE20-\uFE2F\u{101FD}\u{102E0}\u{10376}-\u{1037A}\u{10A01}-\u{10A03}\u{10A05}\u{10A06}\u{10A0C}-\u{10A0F}\u{10A38}-\u{10A3A}\u{10A3F}\u{10AE5}\u{10AE6}\u{10D24}-\u{10D27}\u{10F46}-\u{10F50}\u{11001}\u{11038}-\u{11046}\u{1107F}-\u{11081}\u{110B3}-\u{110B6}\u{110B9}\u{110BA}\u{11100}-\u{11102}\u{11127}-\u{1112B}\u{1112D}-\u{11134}\u{11173}\u{11180}\u{11181}\u{111B6}-\u{111BE}\u{111C9}-\u{111CC}\u{1122F}-\u{11231}\u{11234}\u{11236}\u{11237}\u{1123E}\u{112DF}\u{112E3}-\u{112EA}\u{11300}\u{11301}\u{1133B}\u{1133C}\u{11340}\u{11366}-\u{1136C}\u{11370}-\u{11374}\u{11438}-\u{1143F}\u{11442}-\u{11444}\u{11446}\u{1145E}\u{114B3}-\u{114B8}\u{114BA}\u{114BF}\u{114C0}\u{114C2}\u{114C3}\u{115B2}-\u{115B5}\u{115BC}\u{115BD}\u{115BF}\u{115C0}\u{115DC}\u{115DD}\u{11633}-\u{1163A}\u{1163D}\u{1163F}\u{11640}\u{116AB}\u{116AD}\u{116B0}-\u{116B5}\u{116B7}\u{1171D}-\u{1171F}\u{11722}-\u{11725}\u{11727}-\u{1172B}\u{1182F}-\u{11837}\u{11839}\u{1183A}\u{119D4}-\u{119D7}\u{119DA}\u{119DB}\u{119E0}\u{11A01}-\u{11A0A}\u{11A33}-\u{11A38}\u{11A3B}-\u{11A3E}\u{11A47}\u{11A51}-\u{11A56}\u{11A59}-\u{11A5B}\u{11A8A}-\u{11A96}\u{11A98}\u{11A99}\u{11C30}-\u{11C36}\u{11C38}-\u{11C3D}\u{11C3F}\u{11C92}-\u{11CA7}\u{11CAA}-\u{11CB0}\u{11CB2}\u{11CB3}\u{11CB5}\u{11CB6}\u{11D31}-\u{11D36}\u{11D3A}\u{11D3C}\u{11D3D}\u{11D3F}-\u{11D45}\u{11D47}\u{11D90}\u{11D91}\u{11D95}\u{11D97}\u{11EF3}\u{11EF4}\u{16AF0}-\u{16AF4}\u{16B30}-\u{16B36}\u{16F4F}\u{16F8F}-\u{16F92}\u{1BC9D}\u{1BC9E}\u{1D167}-\u{1D169}\u{1D17B}-\u{1D182}\u{1D185}-\u{1D18B}\u{1D1AA}-\u{1D1AD}\u{1D242}-\u{1D244}\u{1DA00}-\u{1DA36}\u{1DA3B}-\u{1DA6C}\u{1DA75}\u{1DA84}\u{1DA9B}-\u{1DA9F}\u{1DAA1}-\u{1DAAF}\u{1E000}-\u{1E006}\u{1E008}-\u{1E018}\u{1E01B}-\u{1E021}\u{1E023}\u{1E024}\u{1E026}-\u{1E02A}\u{1E130}-\u{1E136}\u{1E2EC}-\u{1E2EF}\u{1E8D0}-\u{1E8D6}\u{1E944}-\u{1E94A}\u{E0100}-\u{E01EF}])|([\u0903\u093B\u093E-\u0940\u0949-\u094C\u094E\u094F\u0982\u0983\u09BE-\u09C0\u09C7\u09C8\u09CB\u09CC\u09D7\u0A03\u0A3E-\u0A40\u0A83\u0ABE-\u0AC0\u0AC9\u0ACB\u0ACC\u0B02\u0B03\u0B3E\u0B40\u0B47\u0B48\u0B4B\u0B4C\u0B57\u0BBE\u0BBF\u0BC1\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCC\u0BD7\u0C01-\u0C03\u0C41-\u0C44\u0C82\u0C83\u0CBE\u0CC0-\u0CC4\u0CC7\u0CC8\u0CCA\u0CCB\u0CD5\u0CD6\u0D02\u0D03\u0D3E-\u0D40\u0D46-\u0D48\u0D4A-\u0D4C\u0D57\u0D82\u0D83\u0DCF-\u0DD1\u0DD8-\u0DDF\u0DF2\u0DF3\u0F3E\u0F3F\u0F7F\u102B\u102C\u1031\u1038\u103B\u103C\u1056\u1057\u1062-\u1064\u1067-\u106D\u1083\u1084\u1087-\u108C\u108F\u109A-\u109C\u17B6\u17BE-\u17C5\u17C7\u17C8\u1923-\u1926\u1929-\u192B\u1930\u1931\u1933-\u1938\u1A19\u1A1A\u1A55\u1A57\u1A61\u1A63\u1A64\u1A6D-\u1A72\u1B04\u1B35\u1B3B\u1B3D-\u1B41\u1B43\u1B44\u1B82\u1BA1\u1BA6\u1BA7\u1BAA\u1BE7\u1BEA-\u1BEC\u1BEE\u1BF2\u1BF3\u1C24-\u1C2B\u1C34\u1C35\u1CE1\u1CF7\u302E\u302F\uA823\uA824\uA827\uA880\uA881\uA8B4-\uA8C3\uA952\uA953\uA983\uA9B4\uA9B5\uA9BA\uA9BB\uA9BE-\uA9C0\uAA2F\uAA30\uAA33\uAA34\uAA4D\uAA7B\uAA7D\uAAEB\uAAEE\uAAEF\uAAF5\uABE3\uABE4\uABE6\uABE7\uABE9\uABEA\uABEC\u{11000}\u{11002}\u{11082}\u{110B0}-\u{110B2}\u{110B7}\u{110B8}\u{1112C}\u{11145}\u{11146}\u{11182}\u{111B3}-\u{111B5}\u{111BF}\u{111C0}\u{1122C}-\u{1122E}\u{11232}\u{11233}\u{11235}\u{112E0}-\u{112E2}\u{11302}\u{11303}\u{1133E}\u{1133F}\u{11341}-\u{11344}\u{11347}\u{11348}\u{1134B}-\u{1134D}\u{11357}\u{11362}\u{11363}\u{11435}-\u{11437}\u{11440}\u{11441}\u{11445}\u{114B0}-\u{114B2}\u{114B9}\u{114BB}-\u{114BE}\u{114C1}\u{115AF}-\u{115B1}\u{115B8}-\u{115BB}\u{115BE}\u{11630}-\u{11632}\u{1163B}\u{1163C}\u{1163E}\u{116AC}\u{116AE}\u{116AF}\u{116B6}\u{11720}\u{11721}\u{11726}\u{1182C}-\u{1182E}\u{11838}\u{119D1}-\u{119D3}\u{119DC}-\u{119DF}\u{119E4}\u{11A39}\u{11A57}\u{11A58}\u{11A97}\u{11C2F}\u{11C3E}\u{11CA9}\u{11CB1}\u{11CB4}\u{11D8A}-\u{11D8E}\u{11D93}\u{11D94}\u{11D96}\u{11EF5}\u{11EF6}\u{16F51}-\u{16F87}\u{1D165}\u{1D166}\u{1D16D}-\u{1D172}])|([\u0488\u0489\u1ABE\u20DD-\u20E0\u20E2-\u20E4\uA670-\uA672])|([0-9\u0660-\u0669\u06F0-\u06F9\u07C0-\u07C9\u0966-\u096F\u09E6-\u09EF\u0A66-\u0A6F\u0AE6-\u0AEF\u0B66-\u0B6F\u0BE6-\u0BEF\u0C66-\u0C6F\u0CE6-\u0CEF\u0D66-\u0D6F\u0DE6-\u0DEF\u0E50-\u0E59\u0ED0-\u0ED9\u0F20-\u0F29\u1040-\u1049\u1090-\u1099\u17E0-\u17E9\u1810-\u1819\u1946-\u194F\u19D0-\u19D9\u1A80-\u1A89\u1A90-\u1A99\u1B50-\u1B59\u1BB0-\u1BB9\u1C40-\u1C49\u1C50-\u1C59\uA620-\uA629\uA8D0-\uA8D9\uA900-\uA909\uA9D0-\uA9D9\uA9F0-\uA9F9\uAA50-\uAA59\uABF0-\uABF9\uFF10-\uFF19\u{104A0}-\u{104A9}\u{10D30}-\u{10D39}\u{11066}-\u{1106F}\u{110F0}-\u{110F9}\u{11136}-\u{1113F}\u{111D0}-\u{111D9}\u{112F0}-\u{112F9}\u{11450}-\u{11459}\u{114D0}-\u{114D9}\u{11650}-\u{11659}\u{116C0}-\u{116C9}\u{11730}-\u{11739}\u{118E0}-\u{118E9}\u{11C50}-\u{11C59}\u{11D50}-\u{11D59}\u{11DA0}-\u{11DA9}\u{16A60}-\u{16A69}\u{16B50}-\u{16B59}\u{1D7CE}-\u{1D7FF}\u{1E140}-\u{1E149}\u{1E2F0}-\u{1E2F9}\u{1E950}-\u{1E959}])|([\u16EE-\u16F0\u2160-\u2182\u2185-\u2188\u3007\u3021-\u3029\u3038-\u303A\uA6E6-\uA6EF\u{10140}-\u{10174}\u{10341}\u{1034A}\u{103D1}-\u{103D5}\u{12400}-\u{1246E}])|([\xB2\xB3\xB9\xBC-\xBE\u09F4-\u09F9\u0B72-\u0B77\u0BF0-\u0BF2\u0C78-\u0C7E\u0D58-\u0D5E\u0D70-\u0D78\u0F2A-\u0F33\u1369-\u137C\u17F0-\u17F9\u19DA\u2070\u2074-\u2079\u2080-\u2089\u2150-\u215F\u2189\u2460-\u249B\u24EA-\u24FF\u2776-\u2793\u2CFD\u3192-\u3195\u3220-\u3229\u3248-\u324F\u3251-\u325F\u3280-\u3289\u32B1-\u32BF\uA830-\uA835\u{10107}-\u{10133}\u{10175}-\u{10178}\u{1018A}\u{1018B}\u{102E1}-\u{102FB}\u{10320}-\u{10323}\u{10858}-\u{1085F}\u{10879}-\u{1087F}\u{108A7}-\u{108AF}\u{108FB}-\u{108FF}\u{10916}-\u{1091B}\u{109BC}\u{109BD}\u{109C0}-\u{109CF}\u{109D2}-\u{109FF}\u{10A40}-\u{10A48}\u{10A7D}\u{10A7E}\u{10A9D}-\u{10A9F}\u{10AEB}-\u{10AEF}\u{10B58}-\u{10B5F}\u{10B78}-\u{10B7F}\u{10BA9}-\u{10BAF}\u{10CFA}-\u{10CFF}\u{10E60}-\u{10E7E}\u{10F1D}-\u{10F26}\u{10F51}-\u{10F54}\u{11052}-\u{11065}\u{111E1}-\u{111F4}\u{1173A}\u{1173B}\u{118EA}-\u{118F2}\u{11C5A}-\u{11C6C}\u{11FC0}-\u{11FD4}\u{16B5B}-\u{16B61}\u{16E80}-\u{16E96}\u{1D2E0}-\u{1D2F3}\u{1D360}-\u{1D378}\u{1E8C7}-\u{1E8CF}\u{1EC71}-\u{1ECAB}\u{1ECAD}-\u{1ECAF}\u{1ECB1}-\u{1ECB4}\u{1ED01}-\u{1ED2D}\u{1ED2F}-\u{1ED3D}\u{1F100}-\u{1F10C}])|([_\u203F\u2040\u2054\uFE33\uFE34\uFE4D-\uFE4F\uFF3F])|([\x2D\u058A\u05BE\u1400\u1806\u2010-\u2015\u2E17\u2E1A\u2E3A\u2E3B\u2E40\u301C\u3030\u30A0\uFE31\uFE32\uFE58\uFE63\uFF0D])|([\(\[\{\u0F3A\u0F3C\u169B\u201A\u201E\u2045\u207D\u208D\u2308\u230A\u2329\u2768\u276A\u276C\u276E\u2770\u2772\u2774\u27C5\u27E6\u27E8\u27EA\u27EC\u27EE\u2983\u2985\u2987\u2989\u298B\u298D\u298F\u2991\u2993\u2995\u2997\u29D8\u29DA\u29FC\u2E22\u2E24\u2E26\u2E28\u2E42\u3008\u300A\u300C\u300E\u3010\u3014\u3016\u3018\u301A\u301D\uFD3F\uFE17\uFE35\uFE37\uFE39\uFE3B\uFE3D\uFE3F\uFE41\uFE43\uFE47\uFE59\uFE5B\uFE5D\uFF08\uFF3B\uFF5B\uFF5F\uFF62])|([\)\]\}\u0F3B\u0F3D\u169C\u2046\u207E\u208E\u2309\u230B\u232A\u2769\u276B\u276D\u276F\u2771\u2773\u2775\u27C6\u27E7\u27E9\u27EB\u27ED\u27EF\u2984\u2986\u2988\u298A\u298C\u298E\u2990\u2992\u2994\u2996\u2998\u29D9\u29DB\u29FD\u2E23\u2E25\u2E27\u2E29\u3009\u300B\u300D\u300F\u3011\u3015\u3017\u3019\u301B\u301E\u301F\uFD3E\uFE18\uFE36\uFE38\uFE3A\uFE3C\uFE3E\uFE40\uFE42\uFE44\uFE48\uFE5A\uFE5C\uFE5E\uFF09\uFF3D\uFF5D\uFF60\uFF63])|([\xAB\u2018\u201B\u201C\u201F\u2039\u2E02\u2E04\u2E09\u2E0C\u2E1C\u2E20])|([\xBB\u2019\u201D\u203A\u2E03\u2E05\u2E0A\u2E0D\u2E1D\u2E21])|([!-#%-'\*,\.\/:;\?@\\\xA1\xA7\xB6\xB7\xBF\u037E\u0387\u055A-\u055F\u0589\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C77\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u166E\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u1805\u1807-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2016\u2017\u2020-\u2027\u2030-\u2038\u203B-\u203E\u2041-\u2043\u2047-\u2051\u2053\u2055-\u205E\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00\u2E01\u2E06-\u2E08\u2E0B\u2E0E-\u2E16\u2E18\u2E19\u2E1B\u2E1E\u2E1F\u2E2A-\u2E2E\u2E30-\u2E39\u2E3C-\u2E3F\u2E41\u2E43-\u2E4F\u3001-\u3003\u303D\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFE10-\uFE16\uFE19\uFE30\uFE45\uFE46\uFE49-\uFE4C\uFE50-\uFE52\uFE54-\uFE57\uFE5F-\uFE61\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF07\uFF0A\uFF0C\uFF0E\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3C\uFF61\uFF64\uFF65\u{10100}-\u{10102}\u{1039F}\u{103D0}\u{1056F}\u{10857}\u{1091F}\u{1093F}\u{10A50}-\u{10A58}\u{10A7F}\u{10AF0}-\u{10AF6}\u{10B39}-\u{10B3F}\u{10B99}-\u{10B9C}\u{10F55}-\u{10F59}\u{11047}-\u{1104D}\u{110BB}\u{110BC}\u{110BE}-\u{110C1}\u{11140}-\u{11143}\u{11174}\u{11175}\u{111C5}-\u{111C8}\u{111CD}\u{111DB}\u{111DD}-\u{111DF}\u{11238}-\u{1123D}\u{112A9}\u{1144B}-\u{1144F}\u{1145B}\u{1145D}\u{114C6}\u{115C1}-\u{115D7}\u{11641}-\u{11643}\u{11660}-\u{1166C}\u{1173C}-\u{1173E}\u{1183B}\u{119E2}\u{11A3F}-\u{11A46}\u{11A9A}-\u{11A9C}\u{11A9E}-\u{11AA2}\u{11C41}-\u{11C45}\u{11C70}\u{11C71}\u{11EF7}\u{11EF8}\u{11FFF}\u{12470}-\u{12474}\u{16A6E}\u{16A6F}\u{16AF5}\u{16B37}-\u{16B3B}\u{16B44}\u{16E97}-\u{16E9A}\u{16FE2}\u{1BC9F}\u{1DA87}-\u{1DA8B}\u{1E95E}\u{1E95F}])|([\+<->\|~\xAC\xB1\xD7\xF7\u03F6\u0606-\u0608\u2044\u2052\u207A-\u207C\u208A-\u208C\u2118\u2140-\u2144\u214B\u2190-\u2194\u219A\u219B\u21A0\u21A3\u21A6\u21AE\u21CE\u21CF\u21D2\u21D4\u21F4-\u22FF\u2320\u2321\u237C\u239B-\u23B3\u23DC-\u23E1\u25B7\u25C1\u25F8-\u25FF\u266F\u27C0-\u27C4\u27C7-\u27E5\u27F0-\u27FF\u2900-\u2982\u2999-\u29D7\u29DC-\u29FB\u29FE-\u2AFF\u2B30-\u2B44\u2B47-\u2B4C\uFB29\uFE62\uFE64-\uFE66\uFF0B\uFF1C-\uFF1E\uFF5C\uFF5E\uFFE2\uFFE9-\uFFEC\u{1D6C1}\u{1D6DB}\u{1D6FB}\u{1D715}\u{1D735}\u{1D74F}\u{1D76F}\u{1D789}\u{1D7A9}\u{1D7C3}\u{1EEF0}\u{1EEF1}])|([\$\xA2-\xA5\u058F\u060B\u07FE\u07FF\u09F2\u09F3\u09FB\u0AF1\u0BF9\u0E3F\u17DB\u20A0-\u20BF\uA838\uFDFC\uFE69\uFF04\uFFE0\uFFE1\uFFE5\uFFE6\u{11FDD}-\u{11FE0}\u{1E2FF}\u{1ECB0}])|([\^`\xA8\xAF\xB4\xB8\u02C2-\u02C5\u02D2-\u02DF\u02E5-\u02EB\u02ED\u02EF-\u02FF\u0375\u0384\u0385\u1FBD\u1FBF-\u1FC1\u1FCD-\u1FCF\u1FDD-\u1FDF\u1FED-\u1FEF\u1FFD\u1FFE\u309B\u309C\uA700-\uA716\uA720\uA721\uA789\uA78A\uAB5B\uFBB2-\uFBC1\uFF3E\uFF40\uFFE3\u{1F3FB}-\u{1F3FF}])|([\xA6\xA9\xAE\xB0\u0482\u058D\u058E\u060E\u060F\u06DE\u06E9\u06FD\u06FE\u07F6\u09FA\u0B70\u0BF3-\u0BF8\u0BFA\u0C7F\u0D4F\u0D79\u0F01-\u0F03\u0F13\u0F15-\u0F17\u0F1A-\u0F1F\u0F34\u0F36\u0F38\u0FBE-\u0FC5\u0FC7-\u0FCC\u0FCE\u0FCF\u0FD5-\u0FD8\u109E\u109F\u1390-\u1399\u166D\u1940\u19DE-\u19FF\u1B61-\u1B6A\u1B74-\u1B7C\u2100\u2101\u2103-\u2106\u2108\u2109\u2114\u2116\u2117\u211E-\u2123\u2125\u2127\u2129\u212E\u213A\u213B\u214A\u214C\u214D\u214F\u218A\u218B\u2195-\u2199\u219C-\u219F\u21A1\u21A2\u21A4\u21A5\u21A7-\u21AD\u21AF-\u21CD\u21D0\u21D1\u21D3\u21D5-\u21F3\u2300-\u2307\u230C-\u231F\u2322-\u2328\u232B-\u237B\u237D-\u239A\u23B4-\u23DB\u23E2-\u2426\u2440-\u244A\u249C-\u24E9\u2500-\u25B6\u25B8-\u25C0\u25C2-\u25F7\u2600-\u266E\u2670-\u2767\u2794-\u27BF\u2800-\u28FF\u2B00-\u2B2F\u2B45\u2B46\u2B4D-\u2B73\u2B76-\u2B95\u2B98-\u2BFF\u2CE5-\u2CEA\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u2FF0-\u2FFB\u3004\u3012\u3013\u3020\u3036\u3037\u303E\u303F\u3190\u3191\u3196-\u319F\u31C0-\u31E3\u3200-\u321E\u322A-\u3247\u3250\u3260-\u327F\u328A-\u32B0\u32C0-\u33FF\u4DC0-\u4DFF\uA490-\uA4C6\uA828-\uA82B\uA836\uA837\uA839\uAA77-\uAA79\uFDFD\uFFE4\uFFE8\uFFED\uFFEE\uFFFC\uFFFD\u{10137}-\u{1013F}\u{10179}-\u{10189}\u{1018C}-\u{1018E}\u{10190}-\u{1019B}\u{101A0}\u{101D0}-\u{101FC}\u{10877}\u{10878}\u{10AC8}\u{1173F}\u{11FD5}-\u{11FDC}\u{11FE1}-\u{11FF1}\u{16B3C}-\u{16B3F}\u{16B45}\u{1BC9C}\u{1D000}-\u{1D0F5}\u{1D100}-\u{1D126}\u{1D129}-\u{1D164}\u{1D16A}-\u{1D16C}\u{1D183}\u{1D184}\u{1D18C}-\u{1D1A9}\u{1D1AE}-\u{1D1E8}\u{1D200}-\u{1D241}\u{1D245}\u{1D300}-\u{1D356}\u{1D800}-\u{1D9FF}\u{1DA37}-\u{1DA3A}\u{1DA6D}-\u{1DA74}\u{1DA76}-\u{1DA83}\u{1DA85}\u{1DA86}\u{1E14F}\u{1ECAC}\u{1ED2E}\u{1F000}-\u{1F02B}\u{1F030}-\u{1F093}\u{1F0A0}-\u{1F0AE}\u{1F0B1}-\u{1F0BF}\u{1F0C1}-\u{1F0CF}\u{1F0D1}-\u{1F0F5}\u{1F110}-\u{1F16C}\u{1F170}-\u{1F1AC}\u{1F1E6}-\u{1F202}\u{1F210}-\u{1F23B}\u{1F240}-\u{1F248}\u{1F250}\u{1F251}\u{1F260}-\u{1F265}\u{1F300}-\u{1F3FA}\u{1F400}-\u{1F6D5}\u{1F6E0}-\u{1F6EC}\u{1F6F0}-\u{1F6FA}\u{1F700}-\u{1F773}\u{1F780}-\u{1F7D8}\u{1F7E0}-\u{1F7EB}\u{1F800}-\u{1F80B}\u{1F810}-\u{1F847}\u{1F850}-\u{1F859}\u{1F860}-\u{1F887}\u{1F890}-\u{1F8AD}\u{1F900}-\u{1F90B}\u{1F90D}-\u{1F971}\u{1F973}-\u{1F976}\u{1F97A}-\u{1F9A2}\u{1F9A5}-\u{1F9AA}\u{1F9AE}-\u{1F9CA}\u{1F9CD}-\u{1FA53}\u{1FA60}-\u{1FA6D}\u{1FA70}-\u{1FA73}\u{1FA78}-\u{1FA7A}\u{1FA80}-\u{1FA82}\u{1FA90}-\u{1FA95}])|([ \xA0\u1680\u2000-\u200A\u202F\u205F\u3000])|(\u2028)|(\u2029)|([\0-\x1F\x7F-\x9F])|([\xAD\u0600-\u0605\u061C\u06DD\u070F\u08E2\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF\uFFF9-\uFFFB\u{110BD}\u{110CD}\u{13430}-\u{13438}\u{1BCA0}-\u{1BCA3}\u{1D173}-\u{1D17A}\u{E0001}\u{E0020}-\u{E007F}])|([\uD800-\uDFFF])|([\uE000-\uF8FF\u{F0000}-\u{FFFFD}\u{100000}-\u{10FFFD}])|([\u0378\u0379\u0380-\u0383\u038B\u038D\u03A2\u0530\u0557\u0558\u058B\u058C\u0590\u05C8-\u05CF\u05EB-\u05EE\u05F5-\u05FF\u061D\u070E\u074B\u074C\u07B2-\u07BF\u07FB\u07FC\u082E\u082F\u083F\u085C\u085D\u085F\u086B-\u089F\u08B5\u08BE-\u08D2\u0984\u098D\u098E\u0991\u0992\u09A9\u09B1\u09B3-\u09B5\u09BA\u09BB\u09C5\u09C6\u09C9\u09CA\u09CF-\u09D6\u09D8-\u09DB\u09DE\u09E4\u09E5\u09FF\u0A00\u0A04\u0A0B-\u0A0E\u0A11\u0A12\u0A29\u0A31\u0A34\u0A37\u0A3A\u0A3B\u0A3D\u0A43-\u0A46\u0A49\u0A4A\u0A4E-\u0A50\u0A52-\u0A58\u0A5D\u0A5F-\u0A65\u0A77-\u0A80\u0A84\u0A8E\u0A92\u0AA9\u0AB1\u0AB4\u0ABA\u0ABB\u0AC6\u0ACA\u0ACE\u0ACF\u0AD1-\u0ADF\u0AE4\u0AE5\u0AF2-\u0AF8\u0B00\u0B04\u0B0D\u0B0E\u0B11\u0B12\u0B29\u0B31\u0B34\u0B3A\u0B3B\u0B45\u0B46\u0B49\u0B4A\u0B4E-\u0B55\u0B58-\u0B5B\u0B5E\u0B64\u0B65\u0B78-\u0B81\u0B84\u0B8B-\u0B8D\u0B91\u0B96-\u0B98\u0B9B\u0B9D\u0BA0-\u0BA2\u0BA5-\u0BA7\u0BAB-\u0BAD\u0BBA-\u0BBD\u0BC3-\u0BC5\u0BC9\u0BCE\u0BCF\u0BD1-\u0BD6\u0BD8-\u0BE5\u0BFB-\u0BFF\u0C0D\u0C11\u0C29\u0C3A-\u0C3C\u0C45\u0C49\u0C4E-\u0C54\u0C57\u0C5B-\u0C5F\u0C64\u0C65\u0C70-\u0C76\u0C8D\u0C91\u0CA9\u0CB4\u0CBA\u0CBB\u0CC5\u0CC9\u0CCE-\u0CD4\u0CD7-\u0CDD\u0CDF\u0CE4\u0CE5\u0CF0\u0CF3-\u0CFF\u0D04\u0D0D\u0D11\u0D45\u0D49\u0D50-\u0D53\u0D64\u0D65\u0D80\u0D81\u0D84\u0D97-\u0D99\u0DB2\u0DBC\u0DBE\u0DBF\u0DC7-\u0DC9\u0DCB-\u0DCE\u0DD5\u0DD7\u0DE0-\u0DE5\u0DF0\u0DF1\u0DF5-\u0E00\u0E3B-\u0E3E\u0E5C-\u0E80\u0E83\u0E85\u0E8B\u0EA4\u0EA6\u0EBE\u0EBF\u0EC5\u0EC7\u0ECE\u0ECF\u0EDA\u0EDB\u0EE0-\u0EFF\u0F48\u0F6D-\u0F70\u0F98\u0FBD\u0FCD\u0FDB-\u0FFF\u10C6\u10C8-\u10CC\u10CE\u10CF\u1249\u124E\u124F\u1257\u1259\u125E\u125F\u1289\u128E\u128F\u12B1\u12B6\u12B7\u12BF\u12C1\u12C6\u12C7\u12D7\u1311\u1316\u1317\u135B\u135C\u137D-\u137F\u139A-\u139F\u13F6\u13F7\u13FE\u13FF\u169D-\u169F\u16F9-\u16FF\u170D\u1715-\u171F\u1737-\u173F\u1754-\u175F\u176D\u1771\u1774-\u177F\u17DE\u17DF\u17EA-\u17EF\u17FA-\u17FF\u180F\u181A-\u181F\u1879-\u187F\u18AB-\u18AF\u18F6-\u18FF\u191F\u192C-\u192F\u193C-\u193F\u1941-\u1943\u196E\u196F\u1975-\u197F\u19AC-\u19AF\u19CA-\u19CF\u19DB-\u19DD\u1A1C\u1A1D\u1A5F\u1A7D\u1A7E\u1A8A-\u1A8F\u1A9A-\u1A9F\u1AAE\u1AAF\u1ABF-\u1AFF\u1B4C-\u1B4F\u1B7D-\u1B7F\u1BF4-\u1BFB\u1C38-\u1C3A\u1C4A-\u1C4C\u1C89-\u1C8F\u1CBB\u1CBC\u1CC8-\u1CCF\u1CFB-\u1CFF\u1DFA\u1F16\u1F17\u1F1E\u1F1F\u1F46\u1F47\u1F4E\u1F4F\u1F58\u1F5A\u1F5C\u1F5E\u1F7E\u1F7F\u1FB5\u1FC5\u1FD4\u1FD5\u1FDC\u1FF0\u1FF1\u1FF5\u1FFF\u2065\u2072\u2073\u208F\u209D-\u209F\u20C0-\u20CF\u20F1-\u20FF\u218C-\u218F\u2427-\u243F\u244B-\u245F\u2B74\u2B75\u2B96\u2B97\u2C2F\u2C5F\u2CF4-\u2CF8\u2D26\u2D28-\u2D2C\u2D2E\u2D2F\u2D68-\u2D6E\u2D71-\u2D7E\u2D97-\u2D9F\u2DA7\u2DAF\u2DB7\u2DBF\u2DC7\u2DCF\u2DD7\u2DDF\u2E50-\u2E7F\u2E9A\u2EF4-\u2EFF\u2FD6-\u2FEF\u2FFC-\u2FFF\u3040\u3097\u3098\u3100-\u3104\u3130\u318F\u31BB-\u31BF\u31E4-\u31EF\u321F\u4DB6-\u4DBF\u9FF0-\u9FFF\uA48D-\uA48F\uA4C7-\uA4CF\uA62C-\uA63F\uA6F8-\uA6FF\uA7C0\uA7C1\uA7C7-\uA7F6\uA82C-\uA82F\uA83A-\uA83F\uA878-\uA87F\uA8C6-\uA8CD\uA8DA-\uA8DF\uA954-\uA95E\uA97D-\uA97F\uA9CE\uA9DA-\uA9DD\uA9FF\uAA37-\uAA3F\uAA4E\uAA4F\uAA5A\uAA5B\uAAC3-\uAADA\uAAF7-\uAB00\uAB07\uAB08\uAB0F\uAB10\uAB17-\uAB1F\uAB27\uAB2F\uAB68-\uAB6F\uABEE\uABEF\uABFA-\uABFF\uD7A4-\uD7AF\uD7C7-\uD7CA\uD7FC-\uD7FF\uFA6E\uFA6F\uFADA-\uFAFF\uFB07-\uFB12\uFB18-\uFB1C\uFB37\uFB3D\uFB3F\uFB42\uFB45\uFBC2-\uFBD2\uFD40-\uFD4F\uFD90\uFD91\uFDC8-\uFDEF\uFDFE\uFDFF\uFE1A-\uFE1F\uFE53\uFE67\uFE6C-\uFE6F\uFE75\uFEFD\uFEFE\uFF00\uFFBF-\uFFC1\uFFC8\uFFC9\uFFD0\uFFD1\uFFD8\uFFD9\uFFDD-\uFFDF\uFFE7\uFFEF-\uFFF8\uFFFE\uFFFF\u{1000C}\u{10027}\u{1003B}\u{1003E}\u{1004E}\u{1004F}\u{1005E}-\u{1007F}\u{100FB}-\u{100FF}\u{10103}-\u{10106}\u{10134}-\u{10136}\u{1018F}\u{1019C}-\u{1019F}\u{101A1}-\u{101CF}\u{101FE}-\u{1027F}\u{1029D}-\u{1029F}\u{102D1}-\u{102DF}\u{102FC}-\u{102FF}\u{10324}-\u{1032C}\u{1034B}-\u{1034F}\u{1037B}-\u{1037F}\u{1039E}\u{103C4}-\u{103C7}\u{103D6}-\u{103FF}\u{1049E}\u{1049F}\u{104AA}-\u{104AF}\u{104D4}-\u{104D7}\u{104FC}-\u{104FF}\u{10528}-\u{1052F}\u{10564}-\u{1056E}\u{10570}-\u{105FF}\u{10737}-\u{1073F}\u{10756}-\u{1075F}\u{10768}-\u{107FF}\u{10806}\u{10807}\u{10809}\u{10836}\u{10839}-\u{1083B}\u{1083D}\u{1083E}\u{10856}\u{1089F}-\u{108A6}\u{108B0}-\u{108DF}\u{108F3}\u{108F6}-\u{108FA}\u{1091C}-\u{1091E}\u{1093A}-\u{1093E}\u{10940}-\u{1097F}\u{109B8}-\u{109BB}\u{109D0}\u{109D1}\u{10A04}\u{10A07}-\u{10A0B}\u{10A14}\u{10A18}\u{10A36}\u{10A37}\u{10A3B}-\u{10A3E}\u{10A49}-\u{10A4F}\u{10A59}-\u{10A5F}\u{10AA0}-\u{10ABF}\u{10AE7}-\u{10AEA}\u{10AF7}-\u{10AFF}\u{10B36}-\u{10B38}\u{10B56}\u{10B57}\u{10B73}-\u{10B77}\u{10B92}-\u{10B98}\u{10B9D}-\u{10BA8}\u{10BB0}-\u{10BFF}\u{10C49}-\u{10C7F}\u{10CB3}-\u{10CBF}\u{10CF3}-\u{10CF9}\u{10D28}-\u{10D2F}\u{10D3A}-\u{10E5F}\u{10E7F}-\u{10EFF}\u{10F28}-\u{10F2F}\u{10F5A}-\u{10FDF}\u{10FF7}-\u{10FFF}\u{1104E}-\u{11051}\u{11070}-\u{1107E}\u{110C2}-\u{110CC}\u{110CE}\u{110CF}\u{110E9}-\u{110EF}\u{110FA}-\u{110FF}\u{11135}\u{11147}-\u{1114F}\u{11177}-\u{1117F}\u{111CE}\u{111CF}\u{111E0}\u{111F5}-\u{111FF}\u{11212}\u{1123F}-\u{1127F}\u{11287}\u{11289}\u{1128E}\u{1129E}\u{112AA}-\u{112AF}\u{112EB}-\u{112EF}\u{112FA}-\u{112FF}\u{11304}\u{1130D}\u{1130E}\u{11311}\u{11312}\u{11329}\u{11331}\u{11334}\u{1133A}\u{11345}\u{11346}\u{11349}\u{1134A}\u{1134E}\u{1134F}\u{11351}-\u{11356}\u{11358}-\u{1135C}\u{11364}\u{11365}\u{1136D}-\u{1136F}\u{11375}-\u{113FF}\u{1145A}\u{1145C}\u{11460}-\u{1147F}\u{114C8}-\u{114CF}\u{114DA}-\u{1157F}\u{115B6}\u{115B7}\u{115DE}-\u{115FF}\u{11645}-\u{1164F}\u{1165A}-\u{1165F}\u{1166D}-\u{1167F}\u{116B9}-\u{116BF}\u{116CA}-\u{116FF}\u{1171B}\u{1171C}\u{1172C}-\u{1172F}\u{11740}-\u{117FF}\u{1183C}-\u{1189F}\u{118F3}-\u{118FE}\u{11900}-\u{1199F}\u{119A8}\u{119A9}\u{119D8}\u{119D9}\u{119E5}-\u{119FF}\u{11A48}-\u{11A4F}\u{11AA3}-\u{11ABF}\u{11AF9}-\u{11BFF}\u{11C09}\u{11C37}\u{11C46}-\u{11C4F}\u{11C6D}-\u{11C6F}\u{11C90}\u{11C91}\u{11CA8}\u{11CB7}-\u{11CFF}\u{11D07}\u{11D0A}\u{11D37}-\u{11D39}\u{11D3B}\u{11D3E}\u{11D48}-\u{11D4F}\u{11D5A}-\u{11D5F}\u{11D66}\u{11D69}\u{11D8F}\u{11D92}\u{11D99}-\u{11D9F}\u{11DAA}-\u{11EDF}\u{11EF9}-\u{11FBF}\u{11FF2}-\u{11FFE}\u{1239A}-\u{123FF}\u{1246F}\u{12475}-\u{1247F}\u{12544}-\u{12FFF}\u{1342F}\u{13439}-\u{143FF}\u{14647}-\u{167FF}\u{16A39}-\u{16A3F}\u{16A5F}\u{16A6A}-\u{16A6D}\u{16A70}-\u{16ACF}\u{16AEE}\u{16AEF}\u{16AF6}-\u{16AFF}\u{16B46}-\u{16B4F}\u{16B5A}\u{16B62}\u{16B78}-\u{16B7C}\u{16B90}-\u{16E3F}\u{16E9B}-\u{16EFF}\u{16F4B}-\u{16F4E}\u{16F88}-\u{16F8E}\u{16FA0}-\u{16FDF}\u{16FE4}-\u{16FFF}\u{187F8}-\u{187FF}\u{18AF3}-\u{1AFFF}\u{1B11F}-\u{1B14F}\u{1B153}-\u{1B163}\u{1B168}-\u{1B16F}\u{1B2FC}-\u{1BBFF}\u{1BC6B}-\u{1BC6F}\u{1BC7D}-\u{1BC7F}\u{1BC89}-\u{1BC8F}\u{1BC9A}\u{1BC9B}\u{1BCA4}-\u{1CFFF}\u{1D0F6}-\u{1D0FF}\u{1D127}\u{1D128}\u{1D1E9}-\u{1D1FF}\u{1D246}-\u{1D2DF}\u{1D2F4}-\u{1D2FF}\u{1D357}-\u{1D35F}\u{1D379}-\u{1D3FF}\u{1D455}\u{1D49D}\u{1D4A0}\u{1D4A1}\u{1D4A3}\u{1D4A4}\u{1D4A7}\u{1D4A8}\u{1D4AD}\u{1D4BA}\u{1D4BC}\u{1D4C4}\u{1D506}\u{1D50B}\u{1D50C}\u{1D515}\u{1D51D}\u{1D53A}\u{1D53F}\u{1D545}\u{1D547}-\u{1D549}\u{1D551}\u{1D6A6}\u{1D6A7}\u{1D7CC}\u{1D7CD}\u{1DA8C}-\u{1DA9A}\u{1DAA0}\u{1DAB0}-\u{1DFFF}\u{1E007}\u{1E019}\u{1E01A}\u{1E022}\u{1E025}\u{1E02B}-\u{1E0FF}\u{1E12D}-\u{1E12F}\u{1E13E}\u{1E13F}\u{1E14A}-\u{1E14D}\u{1E150}-\u{1E2BF}\u{1E2FA}-\u{1E2FE}\u{1E300}-\u{1E7FF}\u{1E8C5}\u{1E8C6}\u{1E8D7}-\u{1E8FF}\u{1E94C}-\u{1E94F}\u{1E95A}-\u{1E95D}\u{1E960}-\u{1EC70}\u{1ECB5}-\u{1ED00}\u{1ED3E}-\u{1EDFF}\u{1EE04}\u{1EE20}\u{1EE23}\u{1EE25}\u{1EE26}\u{1EE28}\u{1EE33}\u{1EE38}\u{1EE3A}\u{1EE3C}-\u{1EE41}\u{1EE43}-\u{1EE46}\u{1EE48}\u{1EE4A}\u{1EE4C}\u{1EE50}\u{1EE53}\u{1EE55}\u{1EE56}\u{1EE58}\u{1EE5A}\u{1EE5C}\u{1EE5E}\u{1EE60}\u{1EE63}\u{1EE65}\u{1EE66}\u{1EE6B}\u{1EE73}\u{1EE78}\u{1EE7D}\u{1EE7F}\u{1EE8A}\u{1EE9C}-\u{1EEA0}\u{1EEA4}\u{1EEAA}\u{1EEBC}-\u{1EEEF}\u{1EEF2}-\u{1EFFF}\u{1F02C}-\u{1F02F}\u{1F094}-\u{1F09F}\u{1F0AF}\u{1F0B0}\u{1F0C0}\u{1F0D0}\u{1F0F6}-\u{1F0FF}\u{1F10D}-\u{1F10F}\u{1F16D}-\u{1F16F}\u{1F1AD}-\u{1F1E5}\u{1F203}-\u{1F20F}\u{1F23C}-\u{1F23F}\u{1F249}-\u{1F24F}\u{1F252}-\u{1F25F}\u{1F266}-\u{1F2FF}\u{1F6D6}-\u{1F6DF}\u{1F6ED}-\u{1F6EF}\u{1F6FB}-\u{1F6FF}\u{1F774}-\u{1F77F}\u{1F7D9}-\u{1F7DF}\u{1F7EC}-\u{1F7FF}\u{1F80C}-\u{1F80F}\u{1F848}-\u{1F84F}\u{1F85A}-\u{1F85F}\u{1F888}-\u{1F88F}\u{1F8AE}-\u{1F8FF}\u{1F90C}\u{1F972}\u{1F977}-\u{1F979}\u{1F9A3}\u{1F9A4}\u{1F9AB}-\u{1F9AD}\u{1F9CB}\u{1F9CC}\u{1FA54}-\u{1FA5F}\u{1FA6E}\u{1FA6F}\u{1FA74}-\u{1FA77}\u{1FA7B}-\u{1FA7F}\u{1FA83}-\u{1FA8F}\u{1FA96}-\u{1FFFF}\u{2A6D7}-\u{2A6FF}\u{2B735}-\u{2B73F}\u{2B81E}\u{2B81F}\u{2CEA2}-\u{2CEAF}\u{2EBE1}-\u{2F7FF}\u{2FA1E}-\u{E0000}\u{E0002}-\u{E001F}\u{E0080}-\u{E00FF}\u{E01F0}-\u{EFFFF}\u{FFFFE}\u{FFFFF}\u{10FFFE}\u{10FFFF}])/u;

	function category(cp) {
	  const match = cp.match(CATEGORY_REGEXP);
	  const index = match.indexOf(cp, 1) - 1;
	  return CATEGORIES[index];
	}

	class AugmentedGlyph {
	  constructor(original, normalized, upper) {
	    this.original = original;
	    this.normalized = normalized;
	    this.upper = upper;
	    this.root = String.fromCodePoint(upper.codePointAt(0));
	    this.category = category(this.root);
	    this.topCategory = this.category[0];
	  }

	  static costFn(a, b) {
	    if (!a || !b) {
	      return 4;
	    }

	    let result = 0;
	    result += +(a.original !== b.original);
	    result += +(a.normalized !== b.normalized);
	    result += +(a.upper !== b.upper);
	    result += +(a.root !== b.root);
	    result += +(a.category !== b.topCategory);
	    result += +(a.topCategory !== b.topCategory);
	    return result;
	  }

	}

	const GLYPH_REGEXP = /[\0-\u02FF\u0370-\u0482\u048A-\u0590\u05BE\u05C0\u05C3\u05C6\u05C8-\u060F\u061B-\u064A\u0660-\u066F\u0671-\u06D5\u06DD\u06DE\u06E5\u06E6\u06E9\u06EE-\u0710\u0712-\u072F\u074B-\u07A5\u07B1-\u07EA\u07F4-\u07FC\u07FE-\u0815\u081A\u0824\u0828\u082E-\u0858\u085C-\u08D2\u08E2\u0904-\u0939\u093D\u0950\u0958-\u0961\u0964-\u0980\u0984-\u09BB\u09BD\u09C5\u09C6\u09C9\u09CA\u09CE-\u09D6\u09D8-\u09E1\u09E4-\u09FD\u09FF\u0A00\u0A04-\u0A3B\u0A3D\u0A43-\u0A46\u0A49\u0A4A\u0A4E-\u0A50\u0A52-\u0A6F\u0A72-\u0A74\u0A76-\u0A80\u0A84-\u0ABB\u0ABD\u0AC6\u0ACA\u0ACE-\u0AE1\u0AE4-\u0AF9\u0B00\u0B04-\u0B3B\u0B3D\u0B45\u0B46\u0B49\u0B4A\u0B4E-\u0B55\u0B58-\u0B61\u0B64-\u0B81\u0B83-\u0BBD\u0BC3-\u0BC5\u0BC9\u0BCE-\u0BD6\u0BD8-\u0BFF\u0C05-\u0C3D\u0C45\u0C49\u0C4E-\u0C54\u0C57-\u0C61\u0C64-\u0C80\u0C84-\u0CBB\u0CBD\u0CC5\u0CC9\u0CCE-\u0CD4\u0CD7-\u0CE1\u0CE4-\u0CFF\u0D04-\u0D3A\u0D3D\u0D45\u0D49\u0D4E-\u0D56\u0D58-\u0D61\u0D64-\u0D81\u0D84-\u0DC9\u0DCB-\u0DCE\u0DD5\u0DD7\u0DE0-\u0DF1\u0DF4-\u0E30\u0E32\u0E33\u0E3B-\u0E46\u0E4F-\u0EB0\u0EB2\u0EB3\u0EBD-\u0EC7\u0ECE-\u0F17\u0F1A-\u0F34\u0F36\u0F38\u0F3A-\u0F3D\u0F40-\u0F70\u0F85\u0F88-\u0F8C\u0F98\u0FBD-\u0FC5\u0FC7-\u102A\u103F-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u1090-\u1099\u109E-\u135C\u1360-\u1711\u1715-\u1731\u1735-\u1751\u1754-\u1771\u1774-\u17B3\u17D4-\u17DC\u17DE-\u180A\u180E-\u1884\u1887-\u18A8\u18AA-\u191F\u192C-\u192F\u193C-\u1A16\u1A1C-\u1A54\u1A5F\u1A7D\u1A7E\u1A80-\u1AAF\u1ABF-\u1AFF\u1B05-\u1B33\u1B45-\u1B6A\u1B74-\u1B7F\u1B83-\u1BA0\u1BAE-\u1BE5\u1BF4-\u1C23\u1C38-\u1CCF\u1CD3\u1CE9-\u1CEC\u1CEE-\u1CF3\u1CF5\u1CF6\u1CFA-\u1DBF\u1DFA\u1E00-\u20CF\u20F1-\u2CEE\u2CF2-\u2D7E\u2D80-\u2DDF\u2E00-\u3029\u3030-\u3098\u309B-\uA66E\uA673\uA67E-\uA69D\uA6A0-\uA6EF\uA6F2-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA828-\uA87F\uA882-\uA8B3\uA8C6-\uA8DF\uA8F2-\uA8FE\uA900-\uA925\uA92E-\uA946\uA954-\uA97F\uA984-\uA9B2\uA9C1-\uA9E4\uA9E6-\uAA28\uAA37-\uAA42\uAA44-\uAA4B\uAA4E-\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2-\uAAEA\uAAF0-\uAAF4\uAAF7-\uABE2\uABEB\uABEE-\uFB1D\uFB1F-\uFDFF\uFE10-\uFE1F\uFE30-\u{101FC}\u{101FE}-\u{102DF}\u{102E1}-\u{10375}\u{1037B}-\u{10A00}\u{10A04}\u{10A07}-\u{10A0B}\u{10A10}-\u{10A37}\u{10A3B}-\u{10A3E}\u{10A40}-\u{10AE4}\u{10AE7}-\u{10D23}\u{10D28}-\u{10F45}\u{10F51}-\u{10FFF}\u{11003}-\u{11037}\u{11047}-\u{1107E}\u{11083}-\u{110AF}\u{110BB}-\u{110FF}\u{11103}-\u{11126}\u{11135}-\u{11144}\u{11147}-\u{11172}\u{11174}-\u{1117F}\u{11183}-\u{111B2}\u{111C1}-\u{111C8}\u{111CD}-\u{1122B}\u{11238}-\u{1123D}\u{1123F}-\u{112DE}\u{112EB}-\u{112FF}\u{11304}-\u{1133A}\u{1133D}\u{11345}\u{11346}\u{11349}\u{1134A}\u{1134E}-\u{11356}\u{11358}-\u{11361}\u{11364}\u{11365}\u{1136D}-\u{1136F}\u{11375}-\u{11434}\u{11447}-\u{1145D}\u{1145F}-\u{114AF}\u{114C4}-\u{115AE}\u{115B6}\u{115B7}\u{115C1}-\u{115DB}\u{115DE}-\u{1162F}\u{11641}-\u{116AA}\u{116B8}-\u{1171C}\u{1172C}-\u{1182B}\u{1183B}-\u{119D0}\u{119D8}\u{119D9}\u{119E1}-\u{119E3}\u{119E5}-\u{11A00}\u{11A0B}-\u{11A32}\u{11A3A}\u{11A3F}-\u{11A46}\u{11A48}-\u{11A50}\u{11A5C}-\u{11A89}\u{11A9A}-\u{11C2E}\u{11C37}\u{11C40}-\u{11C91}\u{11CA8}\u{11CB7}-\u{11D30}\u{11D37}-\u{11D39}\u{11D3B}\u{11D3E}\u{11D46}\u{11D48}-\u{11D89}\u{11D8F}\u{11D92}\u{11D98}-\u{11EF2}\u{11EF7}-\u{16AEF}\u{16AF5}-\u{16B2F}\u{16B37}-\u{16F4E}\u{16F50}\u{16F88}-\u{16F8E}\u{16F93}-\u{1BC9C}\u{1BC9F}-\u{1D164}\u{1D16A}-\u{1D16C}\u{1D173}-\u{1D17A}\u{1D183}\u{1D184}\u{1D18C}-\u{1D1A9}\u{1D1AE}-\u{1D241}\u{1D245}-\u{1D9FF}\u{1DA37}-\u{1DA3A}\u{1DA6D}-\u{1DA74}\u{1DA76}-\u{1DA83}\u{1DA85}-\u{1DA9A}\u{1DAA0}\u{1DAB0}-\u{1DFFF}\u{1E007}\u{1E019}\u{1E01A}\u{1E022}\u{1E025}\u{1E02B}-\u{1E12F}\u{1E137}-\u{1E2EB}\u{1E2F0}-\u{1E8CF}\u{1E8D7}-\u{1E943}\u{1E94B}-\u{E00FF}\u{E01F0}-\u{10FFFF}][\u0300-\u036F\u0483-\u0489\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u0711\u0730-\u074A\u07A6-\u07B0\u07EB-\u07F3\u07FD\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u08D3-\u08E1\u08E3-\u0903\u093A-\u093C\u093E-\u094F\u0951-\u0957\u0962\u0963\u0981-\u0983\u09BC\u09BE-\u09C4\u09C7\u09C8\u09CB-\u09CD\u09D7\u09E2\u09E3\u09FE\u0A01-\u0A03\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A70\u0A71\u0A75\u0A81-\u0A83\u0ABC\u0ABE-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AE2\u0AE3\u0AFA-\u0AFF\u0B01-\u0B03\u0B3C\u0B3E-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B62\u0B63\u0B82\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD7\u0C00-\u0C04\u0C3E-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C62\u0C63\u0C81-\u0C83\u0CBC\u0CBE-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CE2\u0CE3\u0D00-\u0D03\u0D3B\u0D3C\u0D3E-\u0D44\u0D46-\u0D48\u0D4A-\u0D4D\u0D57\u0D62\u0D63\u0D82\u0D83\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DF2\u0DF3\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0EB1\u0EB4-\u0EBC\u0EC8-\u0ECD\u0F18\u0F19\u0F35\u0F37\u0F39\u0F3E\u0F3F\u0F71-\u0F84\u0F86\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u102B-\u103E\u1056-\u1059\u105E-\u1060\u1062-\u1064\u1067-\u106D\u1071-\u1074\u1082-\u108D\u108F\u109A-\u109D\u135D-\u135F\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17B4-\u17D3\u17DD\u180B-\u180D\u1885\u1886\u18A9\u1920-\u192B\u1930-\u193B\u1A17-\u1A1B\u1A55-\u1A5E\u1A60-\u1A7C\u1A7F\u1AB0-\u1ABE\u1B00-\u1B04\u1B34-\u1B44\u1B6B-\u1B73\u1B80-\u1B82\u1BA1-\u1BAD\u1BE6-\u1BF3\u1C24-\u1C37\u1CD0-\u1CD2\u1CD4-\u1CE8\u1CED\u1CF4\u1CF7-\u1CF9\u1DC0-\u1DF9\u1DFB-\u1DFF\u20D0-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302F\u3099\u309A\uA66F-\uA672\uA674-\uA67D\uA69E\uA69F\uA6F0\uA6F1\uA802\uA806\uA80B\uA823-\uA827\uA880\uA881\uA8B4-\uA8C5\uA8E0-\uA8F1\uA8FF\uA926-\uA92D\uA947-\uA953\uA980-\uA983\uA9B3-\uA9C0\uA9E5\uAA29-\uAA36\uAA43\uAA4C\uAA4D\uAA7B-\uAA7D\uAAB0\uAAB2-\uAAB4\uAAB7\uAAB8\uAABE\uAABF\uAAC1\uAAEB-\uAAEF\uAAF5\uAAF6\uABE3-\uABEA\uABEC\uABED\uFB1E\uFE00-\uFE0F\uFE20-\uFE2F\u{101FD}\u{102E0}\u{10376}-\u{1037A}\u{10A01}-\u{10A03}\u{10A05}\u{10A06}\u{10A0C}-\u{10A0F}\u{10A38}-\u{10A3A}\u{10A3F}\u{10AE5}\u{10AE6}\u{10D24}-\u{10D27}\u{10F46}-\u{10F50}\u{11000}-\u{11002}\u{11038}-\u{11046}\u{1107F}-\u{11082}\u{110B0}-\u{110BA}\u{11100}-\u{11102}\u{11127}-\u{11134}\u{11145}\u{11146}\u{11173}\u{11180}-\u{11182}\u{111B3}-\u{111C0}\u{111C9}-\u{111CC}\u{1122C}-\u{11237}\u{1123E}\u{112DF}-\u{112EA}\u{11300}-\u{11303}\u{1133B}\u{1133C}\u{1133E}-\u{11344}\u{11347}\u{11348}\u{1134B}-\u{1134D}\u{11357}\u{11362}\u{11363}\u{11366}-\u{1136C}\u{11370}-\u{11374}\u{11435}-\u{11446}\u{1145E}\u{114B0}-\u{114C3}\u{115AF}-\u{115B5}\u{115B8}-\u{115C0}\u{115DC}\u{115DD}\u{11630}-\u{11640}\u{116AB}-\u{116B7}\u{1171D}-\u{1172B}\u{1182C}-\u{1183A}\u{119D1}-\u{119D7}\u{119DA}-\u{119E0}\u{119E4}\u{11A01}-\u{11A0A}\u{11A33}-\u{11A39}\u{11A3B}-\u{11A3E}\u{11A47}\u{11A51}-\u{11A5B}\u{11A8A}-\u{11A99}\u{11C2F}-\u{11C36}\u{11C38}-\u{11C3F}\u{11C92}-\u{11CA7}\u{11CA9}-\u{11CB6}\u{11D31}-\u{11D36}\u{11D3A}\u{11D3C}\u{11D3D}\u{11D3F}-\u{11D45}\u{11D47}\u{11D8A}-\u{11D8E}\u{11D90}\u{11D91}\u{11D93}-\u{11D97}\u{11EF3}-\u{11EF6}\u{16AF0}-\u{16AF4}\u{16B30}-\u{16B36}\u{16F4F}\u{16F51}-\u{16F87}\u{16F8F}-\u{16F92}\u{1BC9D}\u{1BC9E}\u{1D165}-\u{1D169}\u{1D16D}-\u{1D172}\u{1D17B}-\u{1D182}\u{1D185}-\u{1D18B}\u{1D1AA}-\u{1D1AD}\u{1D242}-\u{1D244}\u{1DA00}-\u{1DA36}\u{1DA3B}-\u{1DA6C}\u{1DA75}\u{1DA84}\u{1DA9B}-\u{1DA9F}\u{1DAA1}-\u{1DAAF}\u{1E000}-\u{1E006}\u{1E008}-\u{1E018}\u{1E01B}-\u{1E021}\u{1E023}\u{1E024}\u{1E026}-\u{1E02A}\u{1E130}-\u{1E136}\u{1E2EC}-\u{1E2EF}\u{1E8D0}-\u{1E8D6}\u{1E944}-\u{1E94A}\u{E0100}-\u{E01EF}]*|^[\u0300-\u036F\u0483-\u0489\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u0711\u0730-\u074A\u07A6-\u07B0\u07EB-\u07F3\u07FD\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u08D3-\u08E1\u08E3-\u0903\u093A-\u093C\u093E-\u094F\u0951-\u0957\u0962\u0963\u0981-\u0983\u09BC\u09BE-\u09C4\u09C7\u09C8\u09CB-\u09CD\u09D7\u09E2\u09E3\u09FE\u0A01-\u0A03\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A70\u0A71\u0A75\u0A81-\u0A83\u0ABC\u0ABE-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AE2\u0AE3\u0AFA-\u0AFF\u0B01-\u0B03\u0B3C\u0B3E-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B62\u0B63\u0B82\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD7\u0C00-\u0C04\u0C3E-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C62\u0C63\u0C81-\u0C83\u0CBC\u0CBE-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CE2\u0CE3\u0D00-\u0D03\u0D3B\u0D3C\u0D3E-\u0D44\u0D46-\u0D48\u0D4A-\u0D4D\u0D57\u0D62\u0D63\u0D82\u0D83\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DF2\u0DF3\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0EB1\u0EB4-\u0EBC\u0EC8-\u0ECD\u0F18\u0F19\u0F35\u0F37\u0F39\u0F3E\u0F3F\u0F71-\u0F84\u0F86\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u102B-\u103E\u1056-\u1059\u105E-\u1060\u1062-\u1064\u1067-\u106D\u1071-\u1074\u1082-\u108D\u108F\u109A-\u109D\u135D-\u135F\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17B4-\u17D3\u17DD\u180B-\u180D\u1885\u1886\u18A9\u1920-\u192B\u1930-\u193B\u1A17-\u1A1B\u1A55-\u1A5E\u1A60-\u1A7C\u1A7F\u1AB0-\u1ABE\u1B00-\u1B04\u1B34-\u1B44\u1B6B-\u1B73\u1B80-\u1B82\u1BA1-\u1BAD\u1BE6-\u1BF3\u1C24-\u1C37\u1CD0-\u1CD2\u1CD4-\u1CE8\u1CED\u1CF4\u1CF7-\u1CF9\u1DC0-\u1DF9\u1DFB-\u1DFF\u20D0-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302F\u3099\u309A\uA66F-\uA672\uA674-\uA67D\uA69E\uA69F\uA6F0\uA6F1\uA802\uA806\uA80B\uA823-\uA827\uA880\uA881\uA8B4-\uA8C5\uA8E0-\uA8F1\uA8FF\uA926-\uA92D\uA947-\uA953\uA980-\uA983\uA9B3-\uA9C0\uA9E5\uAA29-\uAA36\uAA43\uAA4C\uAA4D\uAA7B-\uAA7D\uAAB0\uAAB2-\uAAB4\uAAB7\uAAB8\uAABE\uAABF\uAAC1\uAAEB-\uAAEF\uAAF5\uAAF6\uABE3-\uABEA\uABEC\uABED\uFB1E\uFE00-\uFE0F\uFE20-\uFE2F\u{101FD}\u{102E0}\u{10376}-\u{1037A}\u{10A01}-\u{10A03}\u{10A05}\u{10A06}\u{10A0C}-\u{10A0F}\u{10A38}-\u{10A3A}\u{10A3F}\u{10AE5}\u{10AE6}\u{10D24}-\u{10D27}\u{10F46}-\u{10F50}\u{11000}-\u{11002}\u{11038}-\u{11046}\u{1107F}-\u{11082}\u{110B0}-\u{110BA}\u{11100}-\u{11102}\u{11127}-\u{11134}\u{11145}\u{11146}\u{11173}\u{11180}-\u{11182}\u{111B3}-\u{111C0}\u{111C9}-\u{111CC}\u{1122C}-\u{11237}\u{1123E}\u{112DF}-\u{112EA}\u{11300}-\u{11303}\u{1133B}\u{1133C}\u{1133E}-\u{11344}\u{11347}\u{11348}\u{1134B}-\u{1134D}\u{11357}\u{11362}\u{11363}\u{11366}-\u{1136C}\u{11370}-\u{11374}\u{11435}-\u{11446}\u{1145E}\u{114B0}-\u{114C3}\u{115AF}-\u{115B5}\u{115B8}-\u{115C0}\u{115DC}\u{115DD}\u{11630}-\u{11640}\u{116AB}-\u{116B7}\u{1171D}-\u{1172B}\u{1182C}-\u{1183A}\u{119D1}-\u{119D7}\u{119DA}-\u{119E0}\u{119E4}\u{11A01}-\u{11A0A}\u{11A33}-\u{11A39}\u{11A3B}-\u{11A3E}\u{11A47}\u{11A51}-\u{11A5B}\u{11A8A}-\u{11A99}\u{11C2F}-\u{11C36}\u{11C38}-\u{11C3F}\u{11C92}-\u{11CA7}\u{11CA9}-\u{11CB6}\u{11D31}-\u{11D36}\u{11D3A}\u{11D3C}\u{11D3D}\u{11D3F}-\u{11D45}\u{11D47}\u{11D8A}-\u{11D8E}\u{11D90}\u{11D91}\u{11D93}-\u{11D97}\u{11EF3}-\u{11EF6}\u{16AF0}-\u{16AF4}\u{16B30}-\u{16B36}\u{16F4F}\u{16F51}-\u{16F87}\u{16F8F}-\u{16F92}\u{1BC9D}\u{1BC9E}\u{1D165}-\u{1D169}\u{1D16D}-\u{1D172}\u{1D17B}-\u{1D182}\u{1D185}-\u{1D18B}\u{1D1AA}-\u{1D1AD}\u{1D242}-\u{1D244}\u{1DA00}-\u{1DA36}\u{1DA3B}-\u{1DA6C}\u{1DA75}\u{1DA84}\u{1DA9B}-\u{1DA9F}\u{1DAA1}-\u{1DAAF}\u{1E000}-\u{1E006}\u{1E008}-\u{1E018}\u{1E01B}-\u{1E021}\u{1E023}\u{1E024}\u{1E026}-\u{1E02A}\u{1E130}-\u{1E136}\u{1E2EC}-\u{1E2EF}\u{1E8D0}-\u{1E8D6}\u{1E944}-\u{1E94A}\u{E0100}-\u{E01EF}]+/gu;

	class AugmentedString {
	  constructor(original) {
	    const normalized = new BiString(original).normalize("NFKD");
	    const upper = new BiString(normalized.modified).toUpperCase();
	    const glyphs = [];
	    const alignment = [[0, 0]];

	    for (const match of upper.matchAll(GLYPH_REGEXP)) {
	      const [o, m] = alignment[alignment.length - 1];
	      const upperC = match[0];
	      const normBounds = upper.alignment.originalBounds(o, o + upperC.length);
	      const normC = upper.original.slice(...normBounds);
	      const origBounds = normalized.alignment.originalBounds(normBounds);
	      const origC = normalized.original.slice(...origBounds);
	      glyphs.push(new AugmentedGlyph(origC, normC, upperC));
	      alignment.push([o + normC.length, m + 1]);
	    }

	    this.original = original;
	    this.glyphs = glyphs;
	    this.alignment = normalized.alignment.compose(new Alignment(alignment));
	  }

	}

	function heuristicInfer(original, modified) {
	  const augOrig = new AugmentedString(original);
	  const augMod = new AugmentedString(modified);
	  let alignment = Alignment.infer(augOrig.glyphs, augMod.glyphs, AugmentedGlyph.costFn);
	  alignment = augOrig.alignment.compose(alignment);
	  alignment = alignment.compose(augMod.alignment.inverse());
	  return new BiString(original, modified, alignment);
	}

	const NFC_CHUNK = /[\0-\u{10FFFF}][\u0300-\u034E\u0350-\u036F\u0483-\u0487\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u0711\u0730-\u074A\u07EB-\u07F3\u07FD\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u08D3-\u08E1\u08E3-\u08FF\u093C\u094D\u0951-\u0954\u09BC\u09BE\u09CD\u09D7\u09FE\u0A3C\u0A4D\u0ABC\u0ACD\u0B3C\u0B3E\u0B4D\u0B56\u0B57\u0BBE\u0BCD\u0BD7\u0C4D\u0C55\u0C56\u0CBC\u0CC2\u0CCD\u0CD5\u0CD6\u0D3B\u0D3C\u0D3E\u0D4D\u0D57\u0DCA\u0DCF\u0DDF\u0E38-\u0E3A\u0E48-\u0E4B\u0EB8-\u0EBA\u0EC8-\u0ECB\u0F18\u0F19\u0F35\u0F37\u0F39\u0F71-\u0F75\u0F7A-\u0F7D\u0F80-\u0F84\u0F86\u0F87\u0FC6\u102E\u1037\u1039\u103A\u108D\u1161-\u1175\u11A8-\u11C2\u135D-\u135F\u1714\u1734\u17D2\u17DD\u18A9\u1939-\u193B\u1A17\u1A18\u1A60\u1A75-\u1A7C\u1A7F\u1AB0-\u1ABD\u1B34\u1B35\u1B44\u1B6B-\u1B73\u1BAA\u1BAB\u1BE6\u1BF2\u1BF3\u1C37\u1CD0-\u1CD2\u1CD4-\u1CE0\u1CE2-\u1CE8\u1CED\u1CF4\u1CF8\u1CF9\u1DC0-\u1DF9\u1DFB-\u1DFF\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302F\u3099\u309A\uA66F\uA674-\uA67D\uA69E\uA69F\uA6F0\uA6F1\uA806\uA8C4\uA8E0-\uA8F1\uA92B-\uA92D\uA953\uA9B3\uA9C0\uAAB0\uAAB2-\uAAB4\uAAB7\uAAB8\uAABE\uAABF\uAAC1\uAAF6\uABED\uFB1E\uFE20-\uFE2F\u{101FD}\u{102E0}\u{10376}-\u{1037A}\u{10A0D}\u{10A0F}\u{10A38}-\u{10A3A}\u{10A3F}\u{10AE5}\u{10AE6}\u{10D24}-\u{10D27}\u{10F46}-\u{10F50}\u{11046}\u{1107F}\u{110B9}\u{110BA}\u{11100}-\u{11102}\u{11127}\u{11133}\u{11134}\u{11173}\u{111C0}\u{111CA}\u{11235}\u{11236}\u{112E9}\u{112EA}\u{1133B}\u{1133C}\u{1133E}\u{1134D}\u{11357}\u{11366}-\u{1136C}\u{11370}-\u{11374}\u{11442}\u{11446}\u{1145E}\u{114B0}\u{114BA}\u{114BD}\u{114C2}\u{114C3}\u{115AF}\u{115BF}\u{115C0}\u{1163F}\u{116B6}\u{116B7}\u{1172B}\u{11839}\u{1183A}\u{119E0}\u{11A34}\u{11A47}\u{11A99}\u{11C3F}\u{11D42}\u{11D44}\u{11D45}\u{11D97}\u{16AF0}-\u{16AF4}\u{16B30}-\u{16B36}\u{1BC9E}\u{1D165}-\u{1D169}\u{1D16D}-\u{1D172}\u{1D17B}-\u{1D182}\u{1D185}-\u{1D18B}\u{1D1AA}-\u{1D1AD}\u{1D242}-\u{1D244}\u{1E000}-\u{1E006}\u{1E008}-\u{1E018}\u{1E01B}-\u{1E021}\u{1E023}\u{1E024}\u{1E026}-\u{1E02A}\u{1E130}-\u{1E136}\u{1E2EC}-\u{1E2EF}\u{1E8D0}-\u{1E8D6}\u{1E944}-\u{1E94A}]*/gu;
	const NFD_CHUNK = /[\0-\u{10FFFF}][\u0300-\u034E\u0350-\u036F\u0483-\u0487\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u0711\u0730-\u074A\u07EB-\u07F3\u07FD\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u08D3-\u08E1\u08E3-\u08FF\u093C\u094D\u0951-\u0954\u09BC\u09CD\u09FE\u0A3C\u0A4D\u0ABC\u0ACD\u0B3C\u0B4D\u0BCD\u0C4D\u0C55\u0C56\u0CBC\u0CCD\u0D3B\u0D3C\u0D4D\u0DCA\u0E38-\u0E3A\u0E48-\u0E4B\u0EB8-\u0EBA\u0EC8-\u0ECB\u0F18\u0F19\u0F35\u0F37\u0F39\u0F71-\u0F75\u0F7A-\u0F7D\u0F80-\u0F84\u0F86\u0F87\u0FC6\u1037\u1039\u103A\u108D\u135D-\u135F\u1714\u1734\u17D2\u17DD\u18A9\u1939-\u193B\u1A17\u1A18\u1A60\u1A75-\u1A7C\u1A7F\u1AB0-\u1ABD\u1B34\u1B44\u1B6B-\u1B73\u1BAA\u1BAB\u1BE6\u1BF2\u1BF3\u1C37\u1CD0-\u1CD2\u1CD4-\u1CE0\u1CE2-\u1CE8\u1CED\u1CF4\u1CF8\u1CF9\u1DC0-\u1DF9\u1DFB-\u1DFF\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302F\u3099\u309A\uA66F\uA674-\uA67D\uA69E\uA69F\uA6F0\uA6F1\uA806\uA8C4\uA8E0-\uA8F1\uA92B-\uA92D\uA953\uA9B3\uA9C0\uAAB0\uAAB2-\uAAB4\uAAB7\uAAB8\uAABE\uAABF\uAAC1\uAAF6\uABED\uFB1E\uFE20-\uFE2F\u{101FD}\u{102E0}\u{10376}-\u{1037A}\u{10A0D}\u{10A0F}\u{10A38}-\u{10A3A}\u{10A3F}\u{10AE5}\u{10AE6}\u{10D24}-\u{10D27}\u{10F46}-\u{10F50}\u{11046}\u{1107F}\u{110B9}\u{110BA}\u{11100}-\u{11102}\u{11133}\u{11134}\u{11173}\u{111C0}\u{111CA}\u{11235}\u{11236}\u{112E9}\u{112EA}\u{1133B}\u{1133C}\u{1134D}\u{11366}-\u{1136C}\u{11370}-\u{11374}\u{11442}\u{11446}\u{1145E}\u{114C2}\u{114C3}\u{115BF}\u{115C0}\u{1163F}\u{116B6}\u{116B7}\u{1172B}\u{11839}\u{1183A}\u{119E0}\u{11A34}\u{11A47}\u{11A99}\u{11C3F}\u{11D42}\u{11D44}\u{11D45}\u{11D97}\u{16AF0}-\u{16AF4}\u{16B30}-\u{16B36}\u{1BC9E}\u{1D165}-\u{1D169}\u{1D16D}-\u{1D172}\u{1D17B}-\u{1D182}\u{1D185}-\u{1D18B}\u{1D1AA}-\u{1D1AD}\u{1D242}-\u{1D244}\u{1E000}-\u{1E006}\u{1E008}-\u{1E018}\u{1E01B}-\u{1E021}\u{1E023}\u{1E024}\u{1E026}-\u{1E02A}\u{1E130}-\u{1E136}\u{1E2EC}-\u{1E2EF}\u{1E8D0}-\u{1E8D6}\u{1E944}-\u{1E94A}]*/gu;
	const NFKC_CHUNK = /[\0-\u{10FFFF}][\u0300-\u034E\u0350-\u036F\u0483-\u0487\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u0711\u0730-\u074A\u07EB-\u07F3\u07FD\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u08D3-\u08E1\u08E3-\u08FF\u093C\u094D\u0951-\u0954\u09BC\u09BE\u09CD\u09D7\u09FE\u0A3C\u0A4D\u0ABC\u0ACD\u0B3C\u0B3E\u0B4D\u0B56\u0B57\u0BBE\u0BCD\u0BD7\u0C4D\u0C55\u0C56\u0CBC\u0CC2\u0CCD\u0CD5\u0CD6\u0D3B\u0D3C\u0D3E\u0D4D\u0D57\u0DCA\u0DCF\u0DDF\u0E38-\u0E3A\u0E48-\u0E4B\u0EB8-\u0EBA\u0EC8-\u0ECB\u0F18\u0F19\u0F35\u0F37\u0F39\u0F71-\u0F75\u0F7A-\u0F7D\u0F80-\u0F84\u0F86\u0F87\u0FC6\u102E\u1037\u1039\u103A\u108D\u1161-\u1175\u11A8-\u11C2\u135D-\u135F\u1714\u1734\u17D2\u17DD\u18A9\u1939-\u193B\u1A17\u1A18\u1A60\u1A75-\u1A7C\u1A7F\u1AB0-\u1ABD\u1B34\u1B35\u1B44\u1B6B-\u1B73\u1BAA\u1BAB\u1BE6\u1BF2\u1BF3\u1C37\u1CD0-\u1CD2\u1CD4-\u1CE0\u1CE2-\u1CE8\u1CED\u1CF4\u1CF8\u1CF9\u1DC0-\u1DF9\u1DFB-\u1DFF\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302F\u3099\u309A\u3133\u3135\u3136\u313A-\u313F\u314F-\u3163\uA66F\uA674-\uA67D\uA69E\uA69F\uA6F0\uA6F1\uA806\uA8C4\uA8E0-\uA8F1\uA92B-\uA92D\uA953\uA9B3\uA9C0\uAAB0\uAAB2-\uAAB4\uAAB7\uAAB8\uAABE\uAABF\uAAC1\uAAF6\uABED\uFB1E\uFE20-\uFE2F\uFF9E\uFF9F\uFFA3\uFFA5\uFFA6\uFFAA-\uFFAF\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC\u{101FD}\u{102E0}\u{10376}-\u{1037A}\u{10A0D}\u{10A0F}\u{10A38}-\u{10A3A}\u{10A3F}\u{10AE5}\u{10AE6}\u{10D24}-\u{10D27}\u{10F46}-\u{10F50}\u{11046}\u{1107F}\u{110B9}\u{110BA}\u{11100}-\u{11102}\u{11127}\u{11133}\u{11134}\u{11173}\u{111C0}\u{111CA}\u{11235}\u{11236}\u{112E9}\u{112EA}\u{1133B}\u{1133C}\u{1133E}\u{1134D}\u{11357}\u{11366}-\u{1136C}\u{11370}-\u{11374}\u{11442}\u{11446}\u{1145E}\u{114B0}\u{114BA}\u{114BD}\u{114C2}\u{114C3}\u{115AF}\u{115BF}\u{115C0}\u{1163F}\u{116B6}\u{116B7}\u{1172B}\u{11839}\u{1183A}\u{119E0}\u{11A34}\u{11A47}\u{11A99}\u{11C3F}\u{11D42}\u{11D44}\u{11D45}\u{11D97}\u{16AF0}-\u{16AF4}\u{16B30}-\u{16B36}\u{1BC9E}\u{1D165}-\u{1D169}\u{1D16D}-\u{1D172}\u{1D17B}-\u{1D182}\u{1D185}-\u{1D18B}\u{1D1AA}-\u{1D1AD}\u{1D242}-\u{1D244}\u{1E000}-\u{1E006}\u{1E008}-\u{1E018}\u{1E01B}-\u{1E021}\u{1E023}\u{1E024}\u{1E026}-\u{1E02A}\u{1E130}-\u{1E136}\u{1E2EC}-\u{1E2EF}\u{1E8D0}-\u{1E8D6}\u{1E944}-\u{1E94A}]*/gu;
	const NFKD_CHUNK = /[\0-\u{10FFFF}][\u0300-\u034E\u0350-\u036F\u0483-\u0487\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u0711\u0730-\u074A\u07EB-\u07F3\u07FD\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u08D3-\u08E1\u08E3-\u08FF\u093C\u094D\u0951-\u0954\u09BC\u09CD\u09FE\u0A3C\u0A4D\u0ABC\u0ACD\u0B3C\u0B4D\u0BCD\u0C4D\u0C55\u0C56\u0CBC\u0CCD\u0D3B\u0D3C\u0D4D\u0DCA\u0E38-\u0E3A\u0E48-\u0E4B\u0EB8-\u0EBA\u0EC8-\u0ECB\u0F18\u0F19\u0F35\u0F37\u0F39\u0F71-\u0F75\u0F7A-\u0F7D\u0F80-\u0F84\u0F86\u0F87\u0FC6\u1037\u1039\u103A\u108D\u135D-\u135F\u1714\u1734\u17D2\u17DD\u18A9\u1939-\u193B\u1A17\u1A18\u1A60\u1A75-\u1A7C\u1A7F\u1AB0-\u1ABD\u1B34\u1B44\u1B6B-\u1B73\u1BAA\u1BAB\u1BE6\u1BF2\u1BF3\u1C37\u1CD0-\u1CD2\u1CD4-\u1CE0\u1CE2-\u1CE8\u1CED\u1CF4\u1CF8\u1CF9\u1DC0-\u1DF9\u1DFB-\u1DFF\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302F\u3099\u309A\uA66F\uA674-\uA67D\uA69E\uA69F\uA6F0\uA6F1\uA806\uA8C4\uA8E0-\uA8F1\uA92B-\uA92D\uA953\uA9B3\uA9C0\uAAB0\uAAB2-\uAAB4\uAAB7\uAAB8\uAABE\uAABF\uAAC1\uAAF6\uABED\uFB1E\uFE20-\uFE2F\uFF9E\uFF9F\u{101FD}\u{102E0}\u{10376}-\u{1037A}\u{10A0D}\u{10A0F}\u{10A38}-\u{10A3A}\u{10A3F}\u{10AE5}\u{10AE6}\u{10D24}-\u{10D27}\u{10F46}-\u{10F50}\u{11046}\u{1107F}\u{110B9}\u{110BA}\u{11100}-\u{11102}\u{11133}\u{11134}\u{11173}\u{111C0}\u{111CA}\u{11235}\u{11236}\u{112E9}\u{112EA}\u{1133B}\u{1133C}\u{1134D}\u{11366}-\u{1136C}\u{11370}-\u{11374}\u{11442}\u{11446}\u{1145E}\u{114C2}\u{114C3}\u{115BF}\u{115C0}\u{1163F}\u{116B6}\u{116B7}\u{1172B}\u{11839}\u{1183A}\u{119E0}\u{11A34}\u{11A47}\u{11A99}\u{11C3F}\u{11D42}\u{11D44}\u{11D45}\u{11D97}\u{16AF0}-\u{16AF4}\u{16B30}-\u{16B36}\u{1BC9E}\u{1D165}-\u{1D169}\u{1D16D}-\u{1D172}\u{1D17B}-\u{1D182}\u{1D185}-\u{1D18B}\u{1D1AA}-\u{1D1AD}\u{1D242}-\u{1D244}\u{1E000}-\u{1E006}\u{1E008}-\u{1E018}\u{1E01B}-\u{1E021}\u{1E023}\u{1E024}\u{1E026}-\u{1E02A}\u{1E130}-\u{1E136}\u{1E2EC}-\u{1E2EF}\u{1E8D0}-\u{1E8D6}\u{1E944}-\u{1E94A}]*/gu;

	class BiString {
	  constructor(original, modified, alignment) {
	    if (typeof original !== "string") {
	      throw new TypeError("original was not a string");
	    }

	    this.original = original;

	    if (modified === undefined) {
	      modified = original;

	      if (alignment === undefined) {
	        alignment = Alignment.identity(original.length);
	      }
	    } else if (typeof modified === "string") {
	      if (alignment === undefined) {
	        alignment = new Alignment([[0, 0], [original.length, modified.length]]);
	      }
	    } else {
	      throw new TypeError("modified was not a string");
	    }

	    this.modified = modified;

	    if (!(alignment instanceof Alignment)) {
	      throw new TypeError("alignment was not an Alignment");
	    }

	    const [ostart, oend] = alignment.originalBounds();

	    if (ostart !== 0 || oend !== original.length) {
	      throw new RangeError("Alignment incompatible with original string");
	    }

	    const [mstart, mend] = alignment.modifiedBounds();

	    if (mstart !== 0 || mend !== modified.length) {
	      throw new RangeError("Alignment incompatible with modified string");
	    }

	    this.alignment = alignment;
	    this.length = this.modified.length;

	    for (let i = 0; i < this.length; ++i) {
	      this[i] = this.modified[i];
	    }

	    Object.freeze(this);
	  }

	  static from(str) {
	    if (str instanceof BiString) {
	      return str;
	    } else {
	      return new BiString(str);
	    }
	  }

	  static infer(original, modified) {
	    return heuristicInfer(original, modified);
	  }

	  [Symbol.iterator]() {
	    return this.modified[Symbol.iterator]();
	  }

	  charAt(pos) {
	    return this.modified.charAt(pos);
	  }

	  charCodeAt(pos) {
	    return this.modified.charCodeAt(pos);
	  }

	  codePointAt(pos) {
	    return this.modified.codePointAt(pos);
	  }

	  substring(start, end) {
	    if (end === undefined) {
	      end = this.length;
	    }

	    if (start > end) {
	      [start, end] = [end, start];
	    }

	    start = Math.max(0, Math.min(start, this.length));
	    end = Math.max(0, Math.min(end, this.length));
	    return this.slice(start, end);
	  }

	  slice(start, end) {
	    if (end === undefined) {
	      end = this.length;
	    }

	    if (start < 0) {
	      start += this.length;
	    }

	    if (end < 0) {
	      end += this.length;
	    }

	    if (end < start) {
	      end = start;
	    }

	    start = Math.max(0, Math.min(start, this.length));
	    end = Math.max(0, Math.min(end, this.length));
	    const alignment = this.alignment.sliceByModified(start, end);
	    const modified = this.modified.slice(...alignment.modifiedBounds());
	    const original = this.original.slice(...alignment.originalBounds());
	    const [o0, m0] = alignment.values[0];
	    return new BiString(original, modified, alignment.shift(-o0, -m0));
	  }

	  concat(...others) {
	    let original = this.original;
	    let modified = this.modified;
	    let alignment = this.alignment;

	    for (const other of others) {
	      const biother = BiString.from(other);
	      alignment = alignment.concat(biother.alignment.shift(original.length, modified.length));
	      original += biother.original;
	      modified += biother.modified;
	    }

	    return new BiString(original, modified, alignment);
	  }

	  inverse() {
	    return new BiString(this.modified, this.original, this.alignment.inverse());
	  }

	  equals(other) {
	    return this.original === other.original && this.modified === other.modified && this.alignment.equals(other.alignment);
	  }

	  indexOf(searchValue, fromIndex) {
	    return this.modified.indexOf(searchValue, fromIndex);
	  }

	  lastIndexOf(searchValue, fromIndex) {
	    return this.modified.lastIndexOf(searchValue, fromIndex);
	  }

	  boundsOf(searchValue, fromIndex) {
	    let start = this.indexOf(searchValue, fromIndex);

	    if (start === -1) {
	      return [-1, -1];
	    } else {
	      return [start, start + searchValue.length];
	    }
	  }

	  lastBoundsOf(searchValue, fromIndex) {
	    let start = this.lastIndexOf(searchValue, fromIndex);

	    if (start === -1) {
	      return [-1, -1];
	    } else {
	      return [start, start + searchValue.length];
	    }
	  }

	  search(regexp) {
	    return this.modified.search(regexp);
	  }

	  searchBounds(regexp) {
	    const match = regexp.exec(this.modified);

	    if (match === null) {
	      return [-1, -1];
	    } else {
	      return [match.index, match.index + match[0].length];
	    }
	  }

	  match(regexp) {
	    return this.modified.match(regexp);
	  }

	  matchAll(regexp) {
	    return this.modified.matchAll(regexp);
	  }

	  _replaceString(pattern, replacement) {
	    const replacer = normalizeReplacer(replacement);
	    const builder = new BiStringBuilder(this);

	    while (!builder.isComplete) {
	      const next = this.indexOf(pattern, builder.position);

	      if (next < 0) {
	        break;
	      }

	      builder.skip(next - builder.position);
	      const match = [this.modified.slice(next, next + pattern.length)];
	      match.index = next;
	      match.input = this.modified;
	      builder.replace(pattern.length, replacer(match));
	    }

	    builder.skipRest();
	    return builder.build();
	  }

	  _replaceRegExp(pattern, replacement) {
	    const builder = new BiStringBuilder(this);
	    builder.replaceAll(pattern, replacement);
	    return builder.build();
	  }

	  replace(pattern, replacement) {
	    if (typeof pattern === "string") {
	      return this._replaceString(pattern, replacement);
	    } else {
	      return this._replaceRegExp(pattern, replacement);
	    }
	  }

	  trim() {
	    return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
	  }

	  trimStart() {
	    return this.replace(/^[\s\uFEFF\xA0]+/, "");
	  }

	  trimEnd() {
	    return this.replace(/[\s\uFEFF\xA0]+$/, "");
	  }

	  padStart(targetLength, padString = " ") {
	    const padLength = targetLength - this.length;

	    if (padLength <= 0) {
	      return this;
	    }

	    if (padString.length < padLength) {
	      padString += padString.repeat(targetLength / padString.length);
	    }

	    padString = padString.slice(0, padLength);
	    return new BiString("", padString).concat(this);
	  }

	  padEnd(targetLength, padString = " ") {
	    const padLength = targetLength - this.length;

	    if (padLength <= 0) {
	      return this;
	    }

	    if (padString.length < padLength) {
	      padString += padString.repeat(targetLength / padString.length);
	    }

	    padString = padString.slice(0, padLength);
	    return this.concat(new BiString("", padString));
	  }

	  startsWith(searchString, position) {
	    return this.modified.startsWith(searchString, position);
	  }

	  endsWith(searchString, position) {
	    return this.modified.endsWith(searchString, position);
	  }

	  _splitString(pattern, limit) {
	    if (limit === undefined) {
	      limit = Infinity;
	    }

	    const result = [];

	    for (let i = 0, j, k; i >= 0 && result.length < limit; i = k) {
	      if (pattern.length === 0) {
	        if (i + 1 < this.length) {
	          j = k = i + 1;
	        } else {
	          j = k = -1;
	        }
	      } else {
	        [j, k] = this.boundsOf(pattern, i);
	      }

	      if (j >= 0) {
	        result.push(this.slice(i, j));
	      } else {
	        result.push(this.slice(i));
	      }
	    }

	    return result;
	  }

	  _splitRegExp(pattern, limit) {
	    pattern = cloneRegExp(pattern, "g", "y");

	    if (limit === undefined) {
	      limit = Infinity;
	    }

	    const result = [];
	    let last = 0;

	    for (const match of this.matchAll(pattern)) {
	      if (result.length >= limit) {
	        break;
	      }

	      const start = match.index;
	      const end = start + match[0].length;
	      result.push(this.slice(last, start));

	      if (match.length > 1) {
	        throw new Error("split() with capture groups is not supported");
	      }

	      last = end;
	    }

	    if (result.length < limit) {
	      result.push(this.slice(last));
	    }

	    return result;
	  }

	  split(separator, limit) {
	    if (separator === undefined) {
	      return [this];
	    } else if (typeof separator === "string") {
	      return this._splitString(separator, limit);
	    } else {
	      return this._splitRegExp(separator, limit);
	    }
	  }

	  join(items) {
	    let [first, ...rest] = items;

	    if (first === undefined) {
	      return new BiString("");
	    }

	    first = BiString.from(first);
	    rest = rest.flatMap(s => [this, s]);
	    return first.concat(...rest);
	  }

	  static _normalFormRegex(form) {
	    switch (form) {
	      case "NFC":
	        return NFC_CHUNK;

	      case "NFD":
	        return NFD_CHUNK;

	      case "NFKC":
	        return NFKC_CHUNK;

	      case "NFKD":
	        return NFKD_CHUNK;

	      default:
	        throw new RangeError("Expected a normalization form (NFC, NFD, NFKC, NFKD); found ".concat(form));
	    }
	  }

	  normalize(form) {
	    const regex = BiString._normalFormRegex(form);

	    return this.replace(regex, m => {
	      const result = m.normalize(form);

	      if (result === m) {
	        return new BiString(m);
	      } else {
	        return new BiString(m, result);
	      }
	    });
	  }

	  _isFinalSigmaAt(index) {
	    if (this[index] !== "Σ") {
	      return false;
	    }

	    for (let i = index + 1; i < this.length; ++i) {
	      const cp = this.codePointAt(i);
	      const c = String.fromCodePoint(cp);

	      if (/[\0-&\(-\x2D\/-9;-\]_a-\xA7\xA9-\xAC\xAE\xB0-\xB3\xB5\xB6\xB9-\u02AF\u0370-\u0373\u0376-\u0379\u037B-\u0383\u0386\u0388-\u0482\u048A-\u0558\u055A-\u0590\u05BE\u05C0\u05C3\u05C6\u05C8-\u05F3\u05F5-\u05FF\u0606-\u060F\u061B\u061D-\u063F\u0641-\u064A\u0660-\u066F\u0671-\u06D5\u06DE\u06E9\u06EE-\u070E\u0710\u0712-\u072F\u074B-\u07A5\u07B1-\u07EA\u07F6-\u07F9\u07FB\u07FC\u07FE-\u0815\u082E-\u0858\u085C-\u08D2\u0903-\u0939\u093B\u093D-\u0940\u0949-\u094C\u094E-\u0950\u0958-\u0961\u0964-\u0970\u0972-\u0980\u0982-\u09BB\u09BD-\u09C0\u09C5-\u09CC\u09CE-\u09E1\u09E4-\u09FD\u09FF\u0A00\u0A03-\u0A3B\u0A3D-\u0A40\u0A43-\u0A46\u0A49\u0A4A\u0A4E-\u0A50\u0A52-\u0A6F\u0A72-\u0A74\u0A76-\u0A80\u0A83-\u0ABB\u0ABD-\u0AC0\u0AC6\u0AC9-\u0ACC\u0ACE-\u0AE1\u0AE4-\u0AF9\u0B00\u0B02-\u0B3B\u0B3D\u0B3E\u0B40\u0B45-\u0B4C\u0B4E-\u0B55\u0B57-\u0B61\u0B64-\u0B81\u0B83-\u0BBF\u0BC1-\u0BCC\u0BCE-\u0BFF\u0C01-\u0C03\u0C05-\u0C3D\u0C41-\u0C45\u0C49\u0C4E-\u0C54\u0C57-\u0C61\u0C64-\u0C80\u0C82-\u0CBB\u0CBD\u0CBE\u0CC0-\u0CC5\u0CC7-\u0CCB\u0CCE-\u0CE1\u0CE4-\u0CFF\u0D02-\u0D3A\u0D3D-\u0D40\u0D45-\u0D4C\u0D4E-\u0D61\u0D64-\u0DC9\u0DCB-\u0DD1\u0DD5\u0DD7-\u0E30\u0E32\u0E33\u0E3B-\u0E45\u0E4F-\u0EB0\u0EB2\u0EB3\u0EBD-\u0EC5\u0EC7\u0ECE-\u0F17\u0F1A-\u0F34\u0F36\u0F38\u0F3A-\u0F70\u0F7F\u0F85\u0F88-\u0F8C\u0F98\u0FBD-\u0FC5\u0FC7-\u102C\u1031\u1038\u103B\u103C\u103F-\u1057\u105A-\u105D\u1061-\u1070\u1075-\u1081\u1083\u1084\u1087-\u108C\u108E-\u109C\u109E-\u10FB\u10FD-\u135C\u1360-\u1711\u1715-\u1731\u1735-\u1751\u1754-\u1771\u1774-\u17B3\u17B6\u17BE-\u17C5\u17C7\u17C8\u17D4-\u17D6\u17D8-\u17DC\u17DE-\u180A\u180F-\u1842\u1844-\u1884\u1887-\u18A8\u18AA-\u191F\u1923-\u1926\u1929-\u1931\u1933-\u1938\u193C-\u1A16\u1A19\u1A1A\u1A1C-\u1A55\u1A57\u1A5F\u1A61\u1A63\u1A64\u1A6D-\u1A72\u1A7D\u1A7E\u1A80-\u1AA6\u1AA8-\u1AAF\u1ABF-\u1AFF\u1B04-\u1B33\u1B35\u1B3B\u1B3D-\u1B41\u1B43-\u1B6A\u1B74-\u1B7F\u1B82-\u1BA1\u1BA6\u1BA7\u1BAA\u1BAE-\u1BE5\u1BE7\u1BEA-\u1BEC\u1BEE\u1BF2-\u1C2B\u1C34\u1C35\u1C38-\u1C77\u1C7E-\u1CCF\u1CD3\u1CE1\u1CE9-\u1CEC\u1CEE-\u1CF3\u1CF5-\u1CF7\u1CFA-\u1D2B\u1D6B-\u1D77\u1D79-\u1D9A\u1DFA\u1E00-\u1FBC\u1FBE\u1FC2-\u1FCC\u1FD0-\u1FDC\u1FE0-\u1FEC\u1FF0-\u1FFC\u1FFF-\u200A\u2010-\u2017\u201A-\u2023\u2025\u2026\u2028\u2029\u202F-\u205F\u2065\u2070\u2072-\u207E\u2080-\u208F\u209D-\u20CF\u20F1-\u2C7B\u2C7E-\u2CEE\u2CF2-\u2D6E\u2D70-\u2D7E\u2D80-\u2DDF\u2E00-\u2E2E\u2E30-\u3004\u3006-\u3029\u302E-\u3030\u3036-\u303A\u303C-\u3098\u309F-\u30FB\u30FF-\uA014\uA016-\uA4F7\uA4FE-\uA60B\uA60D-\uA66E\uA673\uA67E\uA680-\uA69B\uA6A0-\uA6EF\uA6F2-\uA6FF\uA722-\uA76F\uA771-\uA787\uA78B-\uA7F7\uA7FA-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA824\uA827-\uA8C3\uA8C6-\uA8DF\uA8F2-\uA8FE\uA900-\uA925\uA92E-\uA946\uA952-\uA97F\uA983-\uA9B2\uA9B4\uA9B5\uA9BA\uA9BB\uA9BE-\uA9CE\uA9D0-\uA9E4\uA9E7-\uAA28\uAA2F\uAA30\uAA33\uAA34\uAA37-\uAA42\uAA44-\uAA4B\uAA4D-\uAA6F\uAA71-\uAA7B\uAA7D-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2-\uAADC\uAADE-\uAAEB\uAAEE-\uAAF2\uAAF5\uAAF7-\uAB5A\uAB60-\uABE4\uABE6\uABE7\uABE9-\uABEC\uABEE-\uFB1D\uFB1F-\uFBB1\uFBC2-\uFDFF\uFE10-\uFE12\uFE14-\uFE1F\uFE30-\uFE51\uFE53\uFE54\uFE56-\uFEFE\uFF00-\uFF06\uFF08-\uFF0D\uFF0F-\uFF19\uFF1B-\uFF3D\uFF3F\uFF41-\uFF6F\uFF71-\uFF9D\uFFA0-\uFFE2\uFFE4-\uFFF8\uFFFC-\u{101FC}\u{101FE}-\u{102DF}\u{102E1}-\u{10375}\u{1037B}-\u{10A00}\u{10A04}\u{10A07}-\u{10A0B}\u{10A10}-\u{10A37}\u{10A3B}-\u{10A3E}\u{10A40}-\u{10AE4}\u{10AE7}-\u{10D23}\u{10D28}-\u{10F45}\u{10F51}-\u{11000}\u{11002}-\u{11037}\u{11047}-\u{1107E}\u{11082}-\u{110B2}\u{110B7}\u{110B8}\u{110BB}\u{110BC}\u{110BE}-\u{110CC}\u{110CE}-\u{110FF}\u{11103}-\u{11126}\u{1112C}\u{11135}-\u{11172}\u{11174}-\u{1117F}\u{11182}-\u{111B5}\u{111BF}-\u{111C8}\u{111CD}-\u{1122E}\u{11232}\u{11233}\u{11235}\u{11238}-\u{1123D}\u{1123F}-\u{112DE}\u{112E0}-\u{112E2}\u{112EB}-\u{112FF}\u{11302}-\u{1133A}\u{1133D}-\u{1133F}\u{11341}-\u{11365}\u{1136D}-\u{1136F}\u{11375}-\u{11437}\u{11440}\u{11441}\u{11445}\u{11447}-\u{1145D}\u{1145F}-\u{114B2}\u{114B9}\u{114BB}-\u{114BE}\u{114C1}\u{114C4}-\u{115B1}\u{115B6}-\u{115BB}\u{115BE}\u{115C1}-\u{115DB}\u{115DE}-\u{11632}\u{1163B}\u{1163C}\u{1163E}\u{11641}-\u{116AA}\u{116AC}\u{116AE}\u{116AF}\u{116B6}\u{116B8}-\u{1171C}\u{11720}\u{11721}\u{11726}\u{1172C}-\u{1182E}\u{11838}\u{1183B}-\u{119D3}\u{119D8}\u{119D9}\u{119DC}-\u{119DF}\u{119E1}-\u{11A00}\u{11A0B}-\u{11A32}\u{11A39}\u{11A3A}\u{11A3F}-\u{11A46}\u{11A48}-\u{11A50}\u{11A57}\u{11A58}\u{11A5C}-\u{11A89}\u{11A97}\u{11A9A}-\u{11C2F}\u{11C37}\u{11C3E}\u{11C40}-\u{11C91}\u{11CA8}\u{11CA9}\u{11CB1}\u{11CB4}\u{11CB7}-\u{11D30}\u{11D37}-\u{11D39}\u{11D3B}\u{11D3E}\u{11D46}\u{11D48}-\u{11D8F}\u{11D92}-\u{11D94}\u{11D96}\u{11D98}-\u{11EF2}\u{11EF5}-\u{1342F}\u{13439}-\u{16AEF}\u{16AF5}-\u{16B2F}\u{16B37}-\u{16B3F}\u{16B44}-\u{16F4E}\u{16F50}-\u{16F8E}\u{16FA0}-\u{16FDF}\u{16FE2}\u{16FE4}-\u{1BC9C}\u{1BC9F}\u{1BCA4}-\u{1D166}\u{1D16A}-\u{1D172}\u{1D183}\u{1D184}\u{1D18C}-\u{1D1A9}\u{1D1AE}-\u{1D241}\u{1D245}-\u{1D9FF}\u{1DA37}-\u{1DA3A}\u{1DA6D}-\u{1DA74}\u{1DA76}-\u{1DA83}\u{1DA85}-\u{1DA9A}\u{1DAA0}\u{1DAB0}-\u{1DFFF}\u{1E007}\u{1E019}\u{1E01A}\u{1E022}\u{1E025}\u{1E02B}-\u{1E12F}\u{1E13E}-\u{1E2EB}\u{1E2F0}-\u{1E8CF}\u{1E8D7}-\u{1E943}\u{1E94C}-\u{1F3FA}\u{1F400}-\u{E0000}\u{E0002}-\u{E001F}\u{E0080}-\u{E00FF}\u{E01F0}-\u{10FFFF}]/uy.test(c)) {
	        if (/[A-Za-z\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u01BA\u01BC-\u01BF\u01C4-\u0293\u0295-\u02B8\u02C0\u02C1\u02E0-\u02E4\u0345\u0370-\u0373\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0560-\u0588\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FD-\u10FF\u13A0-\u13F5\u13F8-\u13FD\u1C80-\u1C88\u1C90-\u1CBA\u1CBD-\u1CBF\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2134\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u217F\u2183\u2184\u24B6-\u24E9\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\uA640-\uA66D\uA680-\uA69D\uA722-\uA787\uA78B-\uA78E\uA790-\uA7BF\uA7C2-\uA7C6\uA7F8-\uA7FA\uAB30-\uAB5A\uAB5C-\uAB67\uAB70-\uABBF\uFB00-\uFB06\uFB13-\uFB17\uFF21-\uFF3A\uFF41-\uFF5A\u{10400}-\u{1044F}\u{104B0}-\u{104D3}\u{104D8}-\u{104FB}\u{10C80}-\u{10CB2}\u{10CC0}-\u{10CF2}\u{118A0}-\u{118DF}\u{16E40}-\u{16E7F}\u{1D400}-\u{1D454}\u{1D456}-\u{1D49C}\u{1D49E}\u{1D49F}\u{1D4A2}\u{1D4A5}\u{1D4A6}\u{1D4A9}-\u{1D4AC}\u{1D4AE}-\u{1D4B9}\u{1D4BB}\u{1D4BD}-\u{1D4C3}\u{1D4C5}-\u{1D505}\u{1D507}-\u{1D50A}\u{1D50D}-\u{1D514}\u{1D516}-\u{1D51C}\u{1D51E}-\u{1D539}\u{1D53B}-\u{1D53E}\u{1D540}-\u{1D544}\u{1D546}\u{1D54A}-\u{1D550}\u{1D552}-\u{1D6A5}\u{1D6A8}-\u{1D6C0}\u{1D6C2}-\u{1D6DA}\u{1D6DC}-\u{1D6FA}\u{1D6FC}-\u{1D714}\u{1D716}-\u{1D734}\u{1D736}-\u{1D74E}\u{1D750}-\u{1D76E}\u{1D770}-\u{1D788}\u{1D78A}-\u{1D7A8}\u{1D7AA}-\u{1D7C2}\u{1D7C4}-\u{1D7CB}\u{1E900}-\u{1E943}\u{1F130}-\u{1F149}\u{1F150}-\u{1F169}\u{1F170}-\u{1F189}]/uy.test(c)) {
	          return false;
	        } else {
	          break;
	        }
	      }

	      if (cp > 0xFFFF) {
	        ++i;
	      }
	    }

	    for (let i = index; i-- > 0;) {
	      let cp = this.charCodeAt(i);

	      if (i > 0 && (cp & 0xFC00) == 0xDC00 && (this.charCodeAt(i - 1) & 0xFC00) == 0xD800) {
	        --i;
	        cp = this.codePointAt(i);
	      }

	      const c = String.fromCodePoint(cp);

	      if (/[\0-&\(-\x2D\/-9;-\]_a-\xA7\xA9-\xAC\xAE\xB0-\xB3\xB5\xB6\xB9-\u02AF\u0370-\u0373\u0376-\u0379\u037B-\u0383\u0386\u0388-\u0482\u048A-\u0558\u055A-\u0590\u05BE\u05C0\u05C3\u05C6\u05C8-\u05F3\u05F5-\u05FF\u0606-\u060F\u061B\u061D-\u063F\u0641-\u064A\u0660-\u066F\u0671-\u06D5\u06DE\u06E9\u06EE-\u070E\u0710\u0712-\u072F\u074B-\u07A5\u07B1-\u07EA\u07F6-\u07F9\u07FB\u07FC\u07FE-\u0815\u082E-\u0858\u085C-\u08D2\u0903-\u0939\u093B\u093D-\u0940\u0949-\u094C\u094E-\u0950\u0958-\u0961\u0964-\u0970\u0972-\u0980\u0982-\u09BB\u09BD-\u09C0\u09C5-\u09CC\u09CE-\u09E1\u09E4-\u09FD\u09FF\u0A00\u0A03-\u0A3B\u0A3D-\u0A40\u0A43-\u0A46\u0A49\u0A4A\u0A4E-\u0A50\u0A52-\u0A6F\u0A72-\u0A74\u0A76-\u0A80\u0A83-\u0ABB\u0ABD-\u0AC0\u0AC6\u0AC9-\u0ACC\u0ACE-\u0AE1\u0AE4-\u0AF9\u0B00\u0B02-\u0B3B\u0B3D\u0B3E\u0B40\u0B45-\u0B4C\u0B4E-\u0B55\u0B57-\u0B61\u0B64-\u0B81\u0B83-\u0BBF\u0BC1-\u0BCC\u0BCE-\u0BFF\u0C01-\u0C03\u0C05-\u0C3D\u0C41-\u0C45\u0C49\u0C4E-\u0C54\u0C57-\u0C61\u0C64-\u0C80\u0C82-\u0CBB\u0CBD\u0CBE\u0CC0-\u0CC5\u0CC7-\u0CCB\u0CCE-\u0CE1\u0CE4-\u0CFF\u0D02-\u0D3A\u0D3D-\u0D40\u0D45-\u0D4C\u0D4E-\u0D61\u0D64-\u0DC9\u0DCB-\u0DD1\u0DD5\u0DD7-\u0E30\u0E32\u0E33\u0E3B-\u0E45\u0E4F-\u0EB0\u0EB2\u0EB3\u0EBD-\u0EC5\u0EC7\u0ECE-\u0F17\u0F1A-\u0F34\u0F36\u0F38\u0F3A-\u0F70\u0F7F\u0F85\u0F88-\u0F8C\u0F98\u0FBD-\u0FC5\u0FC7-\u102C\u1031\u1038\u103B\u103C\u103F-\u1057\u105A-\u105D\u1061-\u1070\u1075-\u1081\u1083\u1084\u1087-\u108C\u108E-\u109C\u109E-\u10FB\u10FD-\u135C\u1360-\u1711\u1715-\u1731\u1735-\u1751\u1754-\u1771\u1774-\u17B3\u17B6\u17BE-\u17C5\u17C7\u17C8\u17D4-\u17D6\u17D8-\u17DC\u17DE-\u180A\u180F-\u1842\u1844-\u1884\u1887-\u18A8\u18AA-\u191F\u1923-\u1926\u1929-\u1931\u1933-\u1938\u193C-\u1A16\u1A19\u1A1A\u1A1C-\u1A55\u1A57\u1A5F\u1A61\u1A63\u1A64\u1A6D-\u1A72\u1A7D\u1A7E\u1A80-\u1AA6\u1AA8-\u1AAF\u1ABF-\u1AFF\u1B04-\u1B33\u1B35\u1B3B\u1B3D-\u1B41\u1B43-\u1B6A\u1B74-\u1B7F\u1B82-\u1BA1\u1BA6\u1BA7\u1BAA\u1BAE-\u1BE5\u1BE7\u1BEA-\u1BEC\u1BEE\u1BF2-\u1C2B\u1C34\u1C35\u1C38-\u1C77\u1C7E-\u1CCF\u1CD3\u1CE1\u1CE9-\u1CEC\u1CEE-\u1CF3\u1CF5-\u1CF7\u1CFA-\u1D2B\u1D6B-\u1D77\u1D79-\u1D9A\u1DFA\u1E00-\u1FBC\u1FBE\u1FC2-\u1FCC\u1FD0-\u1FDC\u1FE0-\u1FEC\u1FF0-\u1FFC\u1FFF-\u200A\u2010-\u2017\u201A-\u2023\u2025\u2026\u2028\u2029\u202F-\u205F\u2065\u2070\u2072-\u207E\u2080-\u208F\u209D-\u20CF\u20F1-\u2C7B\u2C7E-\u2CEE\u2CF2-\u2D6E\u2D70-\u2D7E\u2D80-\u2DDF\u2E00-\u2E2E\u2E30-\u3004\u3006-\u3029\u302E-\u3030\u3036-\u303A\u303C-\u3098\u309F-\u30FB\u30FF-\uA014\uA016-\uA4F7\uA4FE-\uA60B\uA60D-\uA66E\uA673\uA67E\uA680-\uA69B\uA6A0-\uA6EF\uA6F2-\uA6FF\uA722-\uA76F\uA771-\uA787\uA78B-\uA7F7\uA7FA-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA824\uA827-\uA8C3\uA8C6-\uA8DF\uA8F2-\uA8FE\uA900-\uA925\uA92E-\uA946\uA952-\uA97F\uA983-\uA9B2\uA9B4\uA9B5\uA9BA\uA9BB\uA9BE-\uA9CE\uA9D0-\uA9E4\uA9E7-\uAA28\uAA2F\uAA30\uAA33\uAA34\uAA37-\uAA42\uAA44-\uAA4B\uAA4D-\uAA6F\uAA71-\uAA7B\uAA7D-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2-\uAADC\uAADE-\uAAEB\uAAEE-\uAAF2\uAAF5\uAAF7-\uAB5A\uAB60-\uABE4\uABE6\uABE7\uABE9-\uABEC\uABEE-\uFB1D\uFB1F-\uFBB1\uFBC2-\uFDFF\uFE10-\uFE12\uFE14-\uFE1F\uFE30-\uFE51\uFE53\uFE54\uFE56-\uFEFE\uFF00-\uFF06\uFF08-\uFF0D\uFF0F-\uFF19\uFF1B-\uFF3D\uFF3F\uFF41-\uFF6F\uFF71-\uFF9D\uFFA0-\uFFE2\uFFE4-\uFFF8\uFFFC-\u{101FC}\u{101FE}-\u{102DF}\u{102E1}-\u{10375}\u{1037B}-\u{10A00}\u{10A04}\u{10A07}-\u{10A0B}\u{10A10}-\u{10A37}\u{10A3B}-\u{10A3E}\u{10A40}-\u{10AE4}\u{10AE7}-\u{10D23}\u{10D28}-\u{10F45}\u{10F51}-\u{11000}\u{11002}-\u{11037}\u{11047}-\u{1107E}\u{11082}-\u{110B2}\u{110B7}\u{110B8}\u{110BB}\u{110BC}\u{110BE}-\u{110CC}\u{110CE}-\u{110FF}\u{11103}-\u{11126}\u{1112C}\u{11135}-\u{11172}\u{11174}-\u{1117F}\u{11182}-\u{111B5}\u{111BF}-\u{111C8}\u{111CD}-\u{1122E}\u{11232}\u{11233}\u{11235}\u{11238}-\u{1123D}\u{1123F}-\u{112DE}\u{112E0}-\u{112E2}\u{112EB}-\u{112FF}\u{11302}-\u{1133A}\u{1133D}-\u{1133F}\u{11341}-\u{11365}\u{1136D}-\u{1136F}\u{11375}-\u{11437}\u{11440}\u{11441}\u{11445}\u{11447}-\u{1145D}\u{1145F}-\u{114B2}\u{114B9}\u{114BB}-\u{114BE}\u{114C1}\u{114C4}-\u{115B1}\u{115B6}-\u{115BB}\u{115BE}\u{115C1}-\u{115DB}\u{115DE}-\u{11632}\u{1163B}\u{1163C}\u{1163E}\u{11641}-\u{116AA}\u{116AC}\u{116AE}\u{116AF}\u{116B6}\u{116B8}-\u{1171C}\u{11720}\u{11721}\u{11726}\u{1172C}-\u{1182E}\u{11838}\u{1183B}-\u{119D3}\u{119D8}\u{119D9}\u{119DC}-\u{119DF}\u{119E1}-\u{11A00}\u{11A0B}-\u{11A32}\u{11A39}\u{11A3A}\u{11A3F}-\u{11A46}\u{11A48}-\u{11A50}\u{11A57}\u{11A58}\u{11A5C}-\u{11A89}\u{11A97}\u{11A9A}-\u{11C2F}\u{11C37}\u{11C3E}\u{11C40}-\u{11C91}\u{11CA8}\u{11CA9}\u{11CB1}\u{11CB4}\u{11CB7}-\u{11D30}\u{11D37}-\u{11D39}\u{11D3B}\u{11D3E}\u{11D46}\u{11D48}-\u{11D8F}\u{11D92}-\u{11D94}\u{11D96}\u{11D98}-\u{11EF2}\u{11EF5}-\u{1342F}\u{13439}-\u{16AEF}\u{16AF5}-\u{16B2F}\u{16B37}-\u{16B3F}\u{16B44}-\u{16F4E}\u{16F50}-\u{16F8E}\u{16FA0}-\u{16FDF}\u{16FE2}\u{16FE4}-\u{1BC9C}\u{1BC9F}\u{1BCA4}-\u{1D166}\u{1D16A}-\u{1D172}\u{1D183}\u{1D184}\u{1D18C}-\u{1D1A9}\u{1D1AE}-\u{1D241}\u{1D245}-\u{1D9FF}\u{1DA37}-\u{1DA3A}\u{1DA6D}-\u{1DA74}\u{1DA76}-\u{1DA83}\u{1DA85}-\u{1DA9A}\u{1DAA0}\u{1DAB0}-\u{1DFFF}\u{1E007}\u{1E019}\u{1E01A}\u{1E022}\u{1E025}\u{1E02B}-\u{1E12F}\u{1E13E}-\u{1E2EB}\u{1E2F0}-\u{1E8CF}\u{1E8D7}-\u{1E943}\u{1E94C}-\u{1F3FA}\u{1F400}-\u{E0000}\u{E0002}-\u{E001F}\u{E0080}-\u{E00FF}\u{E01F0}-\u{10FFFF}]/uy.test(c)) {
	        if (/[A-Za-z\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u01BA\u01BC-\u01BF\u01C4-\u0293\u0295-\u02B8\u02C0\u02C1\u02E0-\u02E4\u0345\u0370-\u0373\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0560-\u0588\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FD-\u10FF\u13A0-\u13F5\u13F8-\u13FD\u1C80-\u1C88\u1C90-\u1CBA\u1CBD-\u1CBF\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2134\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u217F\u2183\u2184\u24B6-\u24E9\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\uA640-\uA66D\uA680-\uA69D\uA722-\uA787\uA78B-\uA78E\uA790-\uA7BF\uA7C2-\uA7C6\uA7F8-\uA7FA\uAB30-\uAB5A\uAB5C-\uAB67\uAB70-\uABBF\uFB00-\uFB06\uFB13-\uFB17\uFF21-\uFF3A\uFF41-\uFF5A\u{10400}-\u{1044F}\u{104B0}-\u{104D3}\u{104D8}-\u{104FB}\u{10C80}-\u{10CB2}\u{10CC0}-\u{10CF2}\u{118A0}-\u{118DF}\u{16E40}-\u{16E7F}\u{1D400}-\u{1D454}\u{1D456}-\u{1D49C}\u{1D49E}\u{1D49F}\u{1D4A2}\u{1D4A5}\u{1D4A6}\u{1D4A9}-\u{1D4AC}\u{1D4AE}-\u{1D4B9}\u{1D4BB}\u{1D4BD}-\u{1D4C3}\u{1D4C5}-\u{1D505}\u{1D507}-\u{1D50A}\u{1D50D}-\u{1D514}\u{1D516}-\u{1D51C}\u{1D51E}-\u{1D539}\u{1D53B}-\u{1D53E}\u{1D540}-\u{1D544}\u{1D546}\u{1D54A}-\u{1D550}\u{1D552}-\u{1D6A5}\u{1D6A8}-\u{1D6C0}\u{1D6C2}-\u{1D6DA}\u{1D6DC}-\u{1D6FA}\u{1D6FC}-\u{1D714}\u{1D716}-\u{1D734}\u{1D736}-\u{1D74E}\u{1D750}-\u{1D76E}\u{1D770}-\u{1D788}\u{1D78A}-\u{1D7A8}\u{1D7AA}-\u{1D7C2}\u{1D7C4}-\u{1D7CB}\u{1E900}-\u{1E943}\u{1F130}-\u{1F149}\u{1F150}-\u{1F169}\u{1F170}-\u{1F189}]/uy.test(c)) {
	          return true;
	        } else {
	          break;
	        }
	      }
	    }

	    return false;
	  }

	  toLowerCase() {
	    return this.replace(/[A-Z\xC0-\xD6\xD8-\xDE\u0100\u0102\u0104\u0106\u0108\u010A\u010C\u010E\u0110\u0112\u0114\u0116\u0118\u011A\u011C\u011E\u0120\u0122\u0124\u0126\u0128\u012A\u012C\u012E\u0130\u0132\u0134\u0136\u0139\u013B\u013D\u013F\u0141\u0143\u0145\u0147\u014A\u014C\u014E\u0150\u0152\u0154\u0156\u0158\u015A\u015C\u015E\u0160\u0162\u0164\u0166\u0168\u016A\u016C\u016E\u0170\u0172\u0174\u0176\u0178\u0179\u017B\u017D\u0181\u0182\u0184\u0186\u0187\u0189-\u018B\u018E-\u0191\u0193\u0194\u0196-\u0198\u019C\u019D\u019F\u01A0\u01A2\u01A4\u01A6\u01A7\u01A9\u01AC\u01AE\u01AF\u01B1-\u01B3\u01B5\u01B7\u01B8\u01BC\u01C4\u01C5\u01C7\u01C8\u01CA\u01CB\u01CD\u01CF\u01D1\u01D3\u01D5\u01D7\u01D9\u01DB\u01DE\u01E0\u01E2\u01E4\u01E6\u01E8\u01EA\u01EC\u01EE\u01F1\u01F2\u01F4\u01F6-\u01F8\u01FA\u01FC\u01FE\u0200\u0202\u0204\u0206\u0208\u020A\u020C\u020E\u0210\u0212\u0214\u0216\u0218\u021A\u021C\u021E\u0220\u0222\u0224\u0226\u0228\u022A\u022C\u022E\u0230\u0232\u023A\u023B\u023D\u023E\u0241\u0243-\u0246\u0248\u024A\u024C\u024E\u0370\u0372\u0376\u037F\u0386\u0388-\u038A\u038C\u038E\u038F\u0391-\u03A1\u03A3-\u03AB\u03CF\u03D8\u03DA\u03DC\u03DE\u03E0\u03E2\u03E4\u03E6\u03E8\u03EA\u03EC\u03EE\u03F4\u03F7\u03F9\u03FA\u03FD-\u042F\u0460\u0462\u0464\u0466\u0468\u046A\u046C\u046E\u0470\u0472\u0474\u0476\u0478\u047A\u047C\u047E\u0480\u048A\u048C\u048E\u0490\u0492\u0494\u0496\u0498\u049A\u049C\u049E\u04A0\u04A2\u04A4\u04A6\u04A8\u04AA\u04AC\u04AE\u04B0\u04B2\u04B4\u04B6\u04B8\u04BA\u04BC\u04BE\u04C0\u04C1\u04C3\u04C5\u04C7\u04C9\u04CB\u04CD\u04D0\u04D2\u04D4\u04D6\u04D8\u04DA\u04DC\u04DE\u04E0\u04E2\u04E4\u04E6\u04E8\u04EA\u04EC\u04EE\u04F0\u04F2\u04F4\u04F6\u04F8\u04FA\u04FC\u04FE\u0500\u0502\u0504\u0506\u0508\u050A\u050C\u050E\u0510\u0512\u0514\u0516\u0518\u051A\u051C\u051E\u0520\u0522\u0524\u0526\u0528\u052A\u052C\u052E\u0531-\u0556\u10A0-\u10C5\u10C7\u10CD\u13A0-\u13F5\u1C90-\u1CBA\u1CBD-\u1CBF\u1E00\u1E02\u1E04\u1E06\u1E08\u1E0A\u1E0C\u1E0E\u1E10\u1E12\u1E14\u1E16\u1E18\u1E1A\u1E1C\u1E1E\u1E20\u1E22\u1E24\u1E26\u1E28\u1E2A\u1E2C\u1E2E\u1E30\u1E32\u1E34\u1E36\u1E38\u1E3A\u1E3C\u1E3E\u1E40\u1E42\u1E44\u1E46\u1E48\u1E4A\u1E4C\u1E4E\u1E50\u1E52\u1E54\u1E56\u1E58\u1E5A\u1E5C\u1E5E\u1E60\u1E62\u1E64\u1E66\u1E68\u1E6A\u1E6C\u1E6E\u1E70\u1E72\u1E74\u1E76\u1E78\u1E7A\u1E7C\u1E7E\u1E80\u1E82\u1E84\u1E86\u1E88\u1E8A\u1E8C\u1E8E\u1E90\u1E92\u1E94\u1E9E\u1EA0\u1EA2\u1EA4\u1EA6\u1EA8\u1EAA\u1EAC\u1EAE\u1EB0\u1EB2\u1EB4\u1EB6\u1EB8\u1EBA\u1EBC\u1EBE\u1EC0\u1EC2\u1EC4\u1EC6\u1EC8\u1ECA\u1ECC\u1ECE\u1ED0\u1ED2\u1ED4\u1ED6\u1ED8\u1EDA\u1EDC\u1EDE\u1EE0\u1EE2\u1EE4\u1EE6\u1EE8\u1EEA\u1EEC\u1EEE\u1EF0\u1EF2\u1EF4\u1EF6\u1EF8\u1EFA\u1EFC\u1EFE\u1F08-\u1F0F\u1F18-\u1F1D\u1F28-\u1F2F\u1F38-\u1F3F\u1F48-\u1F4D\u1F59\u1F5B\u1F5D\u1F5F\u1F68-\u1F6F\u1F88-\u1F8F\u1F98-\u1F9F\u1FA8-\u1FAF\u1FB8-\u1FBC\u1FC8-\u1FCC\u1FD8-\u1FDB\u1FE8-\u1FEC\u1FF8-\u1FFC\u2126\u212A\u212B\u2132\u2160-\u216F\u2183\u24B6-\u24CF\u2C00-\u2C2E\u2C60\u2C62-\u2C64\u2C67\u2C69\u2C6B\u2C6D-\u2C70\u2C72\u2C75\u2C7E-\u2C80\u2C82\u2C84\u2C86\u2C88\u2C8A\u2C8C\u2C8E\u2C90\u2C92\u2C94\u2C96\u2C98\u2C9A\u2C9C\u2C9E\u2CA0\u2CA2\u2CA4\u2CA6\u2CA8\u2CAA\u2CAC\u2CAE\u2CB0\u2CB2\u2CB4\u2CB6\u2CB8\u2CBA\u2CBC\u2CBE\u2CC0\u2CC2\u2CC4\u2CC6\u2CC8\u2CCA\u2CCC\u2CCE\u2CD0\u2CD2\u2CD4\u2CD6\u2CD8\u2CDA\u2CDC\u2CDE\u2CE0\u2CE2\u2CEB\u2CED\u2CF2\uA640\uA642\uA644\uA646\uA648\uA64A\uA64C\uA64E\uA650\uA652\uA654\uA656\uA658\uA65A\uA65C\uA65E\uA660\uA662\uA664\uA666\uA668\uA66A\uA66C\uA680\uA682\uA684\uA686\uA688\uA68A\uA68C\uA68E\uA690\uA692\uA694\uA696\uA698\uA69A\uA722\uA724\uA726\uA728\uA72A\uA72C\uA72E\uA732\uA734\uA736\uA738\uA73A\uA73C\uA73E\uA740\uA742\uA744\uA746\uA748\uA74A\uA74C\uA74E\uA750\uA752\uA754\uA756\uA758\uA75A\uA75C\uA75E\uA760\uA762\uA764\uA766\uA768\uA76A\uA76C\uA76E\uA779\uA77B\uA77D\uA77E\uA780\uA782\uA784\uA786\uA78B\uA78D\uA790\uA792\uA796\uA798\uA79A\uA79C\uA79E\uA7A0\uA7A2\uA7A4\uA7A6\uA7A8\uA7AA-\uA7AE\uA7B0-\uA7B4\uA7B6\uA7B8\uA7BA\uA7BC\uA7BE\uA7C2\uA7C4-\uA7C6\uFF21-\uFF3A\u{10400}-\u{10427}\u{104B0}-\u{104D3}\u{10C80}-\u{10CB2}\u{118A0}-\u{118BF}\u{16E40}-\u{16E5F}\u{1E900}-\u{1E921}]/gu, (m, ...args) => {
	      if (this._isFinalSigmaAt(args[args.length - 2])) {
	        return "ς";
	      } else {
	        return m.toLowerCase();
	      }
	    });
	  }

	  toUpperCase() {
	    return this.replace(/[a-z\xB5\xDF-\xF6\xF8-\xFF\u0101\u0103\u0105\u0107\u0109\u010B\u010D\u010F\u0111\u0113\u0115\u0117\u0119\u011B\u011D\u011F\u0121\u0123\u0125\u0127\u0129\u012B\u012D\u012F\u0131\u0133\u0135\u0137\u013A\u013C\u013E\u0140\u0142\u0144\u0146\u0148\u0149\u014B\u014D\u014F\u0151\u0153\u0155\u0157\u0159\u015B\u015D\u015F\u0161\u0163\u0165\u0167\u0169\u016B\u016D\u016F\u0171\u0173\u0175\u0177\u017A\u017C\u017E-\u0180\u0183\u0185\u0188\u018C\u0192\u0195\u0199\u019A\u019E\u01A1\u01A3\u01A5\u01A8\u01AD\u01B0\u01B4\u01B6\u01B9\u01BD\u01BF\u01C5\u01C6\u01C8\u01C9\u01CB\u01CC\u01CE\u01D0\u01D2\u01D4\u01D6\u01D8\u01DA\u01DC\u01DD\u01DF\u01E1\u01E3\u01E5\u01E7\u01E9\u01EB\u01ED\u01EF\u01F0\u01F2\u01F3\u01F5\u01F9\u01FB\u01FD\u01FF\u0201\u0203\u0205\u0207\u0209\u020B\u020D\u020F\u0211\u0213\u0215\u0217\u0219\u021B\u021D\u021F\u0223\u0225\u0227\u0229\u022B\u022D\u022F\u0231\u0233\u023C\u023F\u0240\u0242\u0247\u0249\u024B\u024D\u024F-\u0254\u0256\u0257\u0259\u025B\u025C\u0260\u0261\u0263\u0265\u0266\u0268-\u026C\u026F\u0271\u0272\u0275\u027D\u0280\u0282\u0283\u0287-\u028C\u0292\u029D\u029E\u0345\u0371\u0373\u0377\u037B-\u037D\u0390\u03AC-\u03CE\u03D0\u03D1\u03D5-\u03D7\u03D9\u03DB\u03DD\u03DF\u03E1\u03E3\u03E5\u03E7\u03E9\u03EB\u03ED\u03EF-\u03F3\u03F5\u03F8\u03FB\u0430-\u045F\u0461\u0463\u0465\u0467\u0469\u046B\u046D\u046F\u0471\u0473\u0475\u0477\u0479\u047B\u047D\u047F\u0481\u048B\u048D\u048F\u0491\u0493\u0495\u0497\u0499\u049B\u049D\u049F\u04A1\u04A3\u04A5\u04A7\u04A9\u04AB\u04AD\u04AF\u04B1\u04B3\u04B5\u04B7\u04B9\u04BB\u04BD\u04BF\u04C2\u04C4\u04C6\u04C8\u04CA\u04CC\u04CE\u04CF\u04D1\u04D3\u04D5\u04D7\u04D9\u04DB\u04DD\u04DF\u04E1\u04E3\u04E5\u04E7\u04E9\u04EB\u04ED\u04EF\u04F1\u04F3\u04F5\u04F7\u04F9\u04FB\u04FD\u04FF\u0501\u0503\u0505\u0507\u0509\u050B\u050D\u050F\u0511\u0513\u0515\u0517\u0519\u051B\u051D\u051F\u0521\u0523\u0525\u0527\u0529\u052B\u052D\u052F\u0561-\u0587\u10D0-\u10FA\u10FD-\u10FF\u13F8-\u13FD\u1C80-\u1C88\u1D79\u1D7D\u1D8E\u1E01\u1E03\u1E05\u1E07\u1E09\u1E0B\u1E0D\u1E0F\u1E11\u1E13\u1E15\u1E17\u1E19\u1E1B\u1E1D\u1E1F\u1E21\u1E23\u1E25\u1E27\u1E29\u1E2B\u1E2D\u1E2F\u1E31\u1E33\u1E35\u1E37\u1E39\u1E3B\u1E3D\u1E3F\u1E41\u1E43\u1E45\u1E47\u1E49\u1E4B\u1E4D\u1E4F\u1E51\u1E53\u1E55\u1E57\u1E59\u1E5B\u1E5D\u1E5F\u1E61\u1E63\u1E65\u1E67\u1E69\u1E6B\u1E6D\u1E6F\u1E71\u1E73\u1E75\u1E77\u1E79\u1E7B\u1E7D\u1E7F\u1E81\u1E83\u1E85\u1E87\u1E89\u1E8B\u1E8D\u1E8F\u1E91\u1E93\u1E95-\u1E9B\u1EA1\u1EA3\u1EA5\u1EA7\u1EA9\u1EAB\u1EAD\u1EAF\u1EB1\u1EB3\u1EB5\u1EB7\u1EB9\u1EBB\u1EBD\u1EBF\u1EC1\u1EC3\u1EC5\u1EC7\u1EC9\u1ECB\u1ECD\u1ECF\u1ED1\u1ED3\u1ED5\u1ED7\u1ED9\u1EDB\u1EDD\u1EDF\u1EE1\u1EE3\u1EE5\u1EE7\u1EE9\u1EEB\u1EED\u1EEF\u1EF1\u1EF3\u1EF5\u1EF7\u1EF9\u1EFB\u1EFD\u1EFF-\u1F07\u1F10-\u1F15\u1F20-\u1F27\u1F30-\u1F37\u1F40-\u1F45\u1F50-\u1F57\u1F60-\u1F67\u1F70-\u1F7D\u1F80-\u1FB4\u1FB6\u1FB7\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6\u1FC7\u1FCC\u1FD0-\u1FD3\u1FD6\u1FD7\u1FE0-\u1FE7\u1FF2-\u1FF4\u1FF6\u1FF7\u1FFC\u214E\u2170-\u217F\u2184\u24D0-\u24E9\u2C30-\u2C5E\u2C61\u2C65\u2C66\u2C68\u2C6A\u2C6C\u2C73\u2C76\u2C81\u2C83\u2C85\u2C87\u2C89\u2C8B\u2C8D\u2C8F\u2C91\u2C93\u2C95\u2C97\u2C99\u2C9B\u2C9D\u2C9F\u2CA1\u2CA3\u2CA5\u2CA7\u2CA9\u2CAB\u2CAD\u2CAF\u2CB1\u2CB3\u2CB5\u2CB7\u2CB9\u2CBB\u2CBD\u2CBF\u2CC1\u2CC3\u2CC5\u2CC7\u2CC9\u2CCB\u2CCD\u2CCF\u2CD1\u2CD3\u2CD5\u2CD7\u2CD9\u2CDB\u2CDD\u2CDF\u2CE1\u2CE3\u2CEC\u2CEE\u2CF3\u2D00-\u2D25\u2D27\u2D2D\uA641\uA643\uA645\uA647\uA649\uA64B\uA64D\uA64F\uA651\uA653\uA655\uA657\uA659\uA65B\uA65D\uA65F\uA661\uA663\uA665\uA667\uA669\uA66B\uA66D\uA681\uA683\uA685\uA687\uA689\uA68B\uA68D\uA68F\uA691\uA693\uA695\uA697\uA699\uA69B\uA723\uA725\uA727\uA729\uA72B\uA72D\uA72F\uA733\uA735\uA737\uA739\uA73B\uA73D\uA73F\uA741\uA743\uA745\uA747\uA749\uA74B\uA74D\uA74F\uA751\uA753\uA755\uA757\uA759\uA75B\uA75D\uA75F\uA761\uA763\uA765\uA767\uA769\uA76B\uA76D\uA76F\uA77A\uA77C\uA77F\uA781\uA783\uA785\uA787\uA78C\uA791\uA793\uA794\uA797\uA799\uA79B\uA79D\uA79F\uA7A1\uA7A3\uA7A5\uA7A7\uA7A9\uA7B5\uA7B7\uA7B9\uA7BB\uA7BD\uA7BF\uA7C3\uAB53\uAB70-\uABBF\uFB00-\uFB06\uFB13-\uFB17\uFF41-\uFF5A\u{10428}-\u{1044F}\u{104D8}-\u{104FB}\u{10CC0}-\u{10CF2}\u{118C0}-\u{118DF}\u{16E60}-\u{16E7F}\u{1E922}-\u{1E943}]/gu, m => m.toUpperCase());
	  }

	}

	class Token {
	  constructor(text, start, end) {
	    this.text = BiString.from(text);
	    this.start = start;
	    this.end = end;
	    Object.freeze(this);
	  }

	  static slice(text, start, end) {
	    return new Token(BiString.from(text).slice(start, end), start, end);
	  }

	  get original() {
	    return this.text.original;
	  }

	  get modified() {
	    return this.text.modified;
	  }

	}

	class Tokenization {
	  constructor(text, tokens) {
	    this.text = BiString.from(text);
	    this.tokens = Object.freeze(Array.from(tokens));
	    const alignment = [[0, 0]];
	    this.tokens.forEach((token, i) => {
	      alignment.push([token.start, i]);
	      alignment.push([token.end, i + 1]);
	    });
	    alignment.push([this.text.length, this.tokens.length]);
	    this.alignment = new Alignment(alignment);
	    this.length = this.tokens.length;
	    Object.freeze(this);
	  }

	  static infer(text, tokens) {
	    text = BiString.from(text);
	    const result = [];
	    let start = 0,
	        end;

	    for (const token of tokens) {
	      [start, end] = text.boundsOf(token, start);

	      if (start < 0) {
	        throw new Error("Couldn't find the token \"".concat(token, "\" in the text"));
	      }

	      result.push(Token.slice(text, start, end));
	      start = end;
	    }

	    return new Tokenization(text, result);
	  }

	  slice(start, end) {
	    if (start === undefined) {
	      return new Tokenization(this.text, this.tokens);
	    }

	    if (end === undefined) {
	      end = this.length;
	    }

	    if (start < 0) {
	      start += this.length;
	    }

	    if (end < 0) {
	      end += this.length;
	    }

	    if (end < start) {
	      end = start;
	    }

	    const substring = this.substring(start, end);
	    const tokens = this.tokens.slice(start, end);

	    if (tokens.length > 0) {
	      const delta = tokens[0].start;

	      for (const i in tokens) {
	        const token = tokens[i];
	        tokens[i] = new Token(token.text, token.start - delta, token.end - delta);
	      }
	    }

	    return new Tokenization(substring, tokens);
	  }

	  substring(start, end) {
	    const [first, last] = this.textBounds(start, end);
	    return this.text.substring(first, last);
	  }

	  textBounds(start, end) {
	    return this.alignment.originalBounds(start, end);
	  }

	  originalBounds(start, end) {
	    return this.text.alignment.originalBounds(this.textBounds(start, end));
	  }

	  boundsForText(start, end) {
	    return this.alignment.modifiedBounds(start, end);
	  }

	  boundsForOriginal(start, end) {
	    const textBounds = this.text.alignment.modifiedBounds(start, end);
	    return this.boundsForText(...textBounds);
	  }

	  sliceByText(start, end) {
	    return this.slice(...this.boundsForText(start, end));
	  }

	  sliceByOriginal(start, end) {
	    return this.slice(...this.boundsForOriginal(start, end));
	  }

	  snapTextBounds(start, end) {
	    return this.textBounds(...this.boundsForText(start, end));
	  }

	  snapOriginalBounds(start, end) {
	    return this.originalBounds(...this.boundsForOriginal(start, end));
	  }

	}

	class RegExpTokenizer {
	  constructor(pattern) {
	    this._pattern = cloneRegExp(pattern, "g");
	  }

	  tokenize(text) {
	    text = BiString.from(text);
	    const tokens = [];

	    for (const match of text.matchAll(this._pattern)) {
	      const start = match.index;
	      const end = start + match[0].length;
	      tokens.push(Token.slice(text, start, end));
	    }

	    return new Tokenization(text, tokens);
	  }

	}

	class SplittingTokenizer {
	  constructor(pattern) {
	    this._pattern = cloneRegExp(pattern, "g");
	  }

	  tokenize(text) {
	    text = BiString.from(text);
	    const tokens = [];
	    let last = 0;

	    for (const match of text.matchAll(this._pattern)) {
	      const start = match.index;

	      if (start > last) {
	        tokens.push(Token.slice(text, last, start));
	      }

	      last = start + match[0].length;
	    }

	    if (text.length > last) {
	      tokens.push(Token.slice(text, last, text.length));
	    }

	    return new Tokenization(text, tokens);
	  }

	}

	var bistring = /*#__PURE__*/Object.freeze({
		'default': BiString,
		Alignment: Alignment,
		BiString: BiString,
		BiStringBuilder: BiStringBuilder,
		RegExpTokenizer: RegExpTokenizer,
		SplittingTokenizer: SplittingTokenizer,
		Token: Token,
		Tokenization: Tokenization
	});

	window["BiString"] = BiString;
	window["bistring"] = bistring;

	const code = document.getElementById("code");
	const update = document.getElementById("update");
	const original = document.getElementById("original");
	const modified = document.getElementById("modified");
	let bs;

	function updateCode() {
	    try {
	        const func = new Function(code.value);
	        bs = BiString.from(func());
	    } catch (error) {
	        console.log(error);
	        bs = new BiString(error.name + ": " + error.message);
	    }

	    original.textContent = bs.original;
	    modified.textContent = bs.modified;
	}

	code.addEventListener("input", updateCode);
	updateCode();

	function fakeSelection(node, str, start, end) {
	    while (node.firstChild) {
	        node.firstChild.remove();
	    }

	    const prefix = str.slice(0, start);
	    node.appendChild(document.createTextNode(prefix));

	    const infix = str.slice(start, end);
	    const span = document.createElement("span");
	    span.style.background = "Highlight";
	    span.style.color = "HighlightText";
	    span.textContent = infix;
	    node.appendChild(span);

	    const suffix = str.slice(end);
	    node.appendChild(document.createTextNode(suffix));
	}

	function deselect() {
	    if (original.childNodes.length !== 1) {
	        original.textContent = bs.original;
	    }
	    if (modified.childNodes.length !== 1) {
	        modified.textContent = bs.modified;
	    }
	}

	function updateSelection() {
	    const selection = window.getSelection();
	    if (selection.rangeCount < 1) {
	        deselect();
	        return;
	    }

	    const range = selection.getRangeAt(0);
	    if (range.collapsed) {
	        deselect();
	        return;
	    }

	    const container = range.startContainer;
	    if (range.endContainer !== container) {
	        deselect();
	        return;
	    }

	    const start = Math.min(range.startOffset, range.endOffset);
	    const end = Math.max(range.startOffset, range.endOffset);

	    const originalText = original.childNodes[0];
	    const modifiedText = modified.childNodes[0];
	    if (container === originalText) {
	        fakeSelection(modified, bs.modified, ...bs.alignment.modifiedBounds(start, end));
	    } else if (container === modifiedText) {
	        fakeSelection(original, bs.original, ...bs.alignment.originalBounds(start, end));
	    } else {
	        deselect();
	    }
	}

	document.addEventListener("selectionchange", updateSelection);
	updateSelection();

}());
