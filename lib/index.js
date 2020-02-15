/* --------------------
 * react-loadable-data module
 * ------------------*/

'use strict';

// Modules

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var React = require('react');

// Exports

// Context
var defaultContext = {
	getData: function getData() {
		return { loaded: false, data: null };
	},
	report: function report(promise) {
		return promise;
	}
};

var _React$createContext = React.createContext(defaultContext),
    Provider = _React$createContext.Provider,
    Consumer = _React$createContext.Consumer;

// LoadableDataComponent class


var LoadableDataComponent = function (_React$Component) {
	_inherits(LoadableDataComponent, _React$Component);

	function LoadableDataComponent(props) {
		_classCallCheck(this, LoadableDataComponent);

		// Get data from cache if it's there
		var _this = _possibleConstructorReturn(this, (LoadableDataComponent.__proto__ || Object.getPrototypeOf(LoadableDataComponent)).call(this, props));

		var _props$context$getDat = props.context.getData(props.name),
		    loaded = _props$context$getDat.loaded,
		    data = _props$context$getDat.data;

		// Client side or server-side and data not loaded yet


		_this.loading = false;
		_this.state = {
			data: data,
			error: null,
			loaded: loaded
		};
		return _this;
	}

	_createClass(LoadableDataComponent, [{
		key: 'componentWillMount',
		value: function componentWillMount() {
			this._mounted = true;
			if (this.loading || this.state.loaded) return;
			this._load();
		}
	}, {
		key: 'componentWillUnmount',
		value: function componentWillUnmount() {
			this._mounted = false;
		}
	}, {
		key: 'load',
		value: function load() {
			if (this.loading) return;

			this.setState({
				data: null,
				error: null,
				loaded: false
			});

			this._load();
		}
	}, {
		key: '_load',
		value: function _load() {
			var _this2 = this;

			//console.log('loading!');

			this.loading = true;

			// Run loader
			var _props = this.props,
			    loader = _props.loader,
			    context = _props.context,
			    parentProps = _props.parentProps,
			    name = _props.name;

			var promise = loader(parentProps);

			// Report promise
			promise = context.report(promise, name);

			// Update state once loaded
			promise.then(function (data) {
				return _this2._loaded(data);
			}, function (err) {
				return _this2._errored(err);
			});
		}
	}, {
		key: '_loaded',
		value: function _loaded(data) {
			if (!this._mounted) return;

			this.loading = false;
			this.setState({
				data: data,
				error: null,
				loaded: true
			});
		}
	}, {
		key: '_errored',
		value: function _errored(err) {
			if (!this._mounted) return;

			this.loading = false;
			this.setState({
				data: null,
				error: err,
				loaded: false
			});
		}
	}, {
		key: 'render',
		value: function render() {
			var state = this.state,
			    props = this.props;

			if (!state.loaded) {
				return React.createElement(props.Loading, { error: state.error });
			} else {
				var componentProps = Object.assign({}, props.parentProps, _defineProperty({}, props.dataPropName, state.data));
				return React.createElement(props.component, componentProps);
			}
		}
	}]);

	return LoadableDataComponent;
}(React.Component);

/**
 * Function to create a loadable data component
 * @param {Object} options
 * @param {Function} options.loader - Loader function - should return Promise
 * @param {React.Component} options.Loading - Component to render while loading
 * @param {React.Component} options.component - Component to render when loaded
 * @param {string} [options.dataPropName='data'] - Prop name to provide data on to component
 */

var counter = 0;

function LoadableData(options) {
	var loader = options.loader,
	    component = options.component; // jshint ignore:line

	var Loading = options.Loading;

	if (!Loading) Loading = function Loading() {
		return null;
	};

	var name = options.name;

	if (name == null) {
		name = '_' + counter++;
	} else if (typeof name != 'string') {
		throw new Error('name must be a string if provided');
	}

	var dataPropName = options.dataPropName;

	if (dataPropName == null) {
		dataPropName = 'data';
	} else if (typeof dataPropName != 'string') {
		throw new Error('dataPropName must be a string if provided');
	}

	return function (props) {
		return React.createElement(
			Consumer,
			null,
			function (context) {
				return React.createElement(LoadableDataComponent, {
					name: name,
					loader: loader,
					Loading: Loading,
					component: component,
					dataPropName: dataPropName,
					parentProps: props,
					context: context
				});
			}
		);
	};

	return LoadableDataComponent;
}

module.exports = LoadableData;

/**
 * Client Provider component.
 * Passed data array will be used to bootstrap components with data.
 * As Loadable components request data, it is removed from the array.
 * This is to ensure the cached data is only used for initial render.
 *
 * @param {Object} props - Props object
 * @param {Object} [props.data={}] - Data object (usually filled by server and passed to client)
 */
function ClientProvider(props) {
	var datas = props.data || {};

	var context = {
		getData: function getData(name) {
			var data = datas[name];
			if (!data) return { loaded: false, data: null };

			delete datas[name];
			return { loaded: true, data: data };
		},
		report: function report(promise) {
			return promise;
		}
	};

	return React.createElement(
		Provider,
		{ value: context },
		React.Children.only(props.children)
	);
}

LoadableData.ClientProvider = ClientProvider;

/**
 * Server Provider component.
 * Passed data array will be used to bootstrap components with data.
 * Further load actions add promises to `promises` array.
 * The components are passed back a fake promise that never resolves to avoid
 * state updates (unless since this is rendering on server).
 *
 * @param {Object} props - Props object
 * @param {Object} [props.data={}] - Data object (usually filled by server and passed to client)
 * @param {Array} [props.promises=[]] - Promises array (must be provided empty)
 */
var fakePromise = {
	then: function then() {}
};

function ServerProvider(props) {
	var datas = props.data || {},
	    promises = props.promises || [];

	if (promises.length > 0) throw new Error('Promises array must be empty');

	var context = {
		getData: function getData(name) {
			var data = datas[name];
			if (!data) return { loaded: false, data: null };
			return { loaded: true, data: data };
		},
		report: function report(promise, name) {
			// Add promise to array
			// When promise resolves, fetched data is added to data object
			promise = promise.then(function (data) {
				// Save to datas
				datas[name] = data;

				// Remove promise from array
				promises.splice(promises.indexOf(promise), 1);

				// Do not return result
				return null;
			});
			promises.push(promise);

			// Return fake promise so state never gets updated
			return fakePromise;
		}
	};

	return React.createElement(
		Provider,
		{ value: context },
		React.Children.only(props.children)
	);
}

LoadableData.ServerProvider = ServerProvider;