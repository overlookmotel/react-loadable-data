/* --------------------
 * react-loadable-data module
 * ------------------*/

'use strict';

// Modules
const React = require('react');

// Exports

// Context
const defaultContext = {
	getData: () => ({loaded: false, data: null}),
	report: promise => promise
};

const {Provider, Consumer} = React.createContext(defaultContext);

// LoadableDataComponent class
class LoadableDataComponent extends React.Component {
	constructor(props) {
		super(props);

		// Get data from cache if it's there
		const {loaded, data} = props.context.getData();

		// Client side or server-side and data not loaded yet
		this.state = {
			data,
			error: null,
			loaded,
			loading: false
		};
	}

	componentWillMount() {
		this._mounted = true;
		if (this.state.loading || this.state.loaded) return;
		this._load();
	}

	componentWillUnmount() {
		this._mounted = false;
	}

	load() {
		if (this.state.loading) return;

		this.setState({
			data: null,
			error: null,
			loaded: false,
			loading: false
		});

		this._load();
	}

	_load() {
		//console.log('loading!');

		this.setState({loading: true});

		// Run loader
		const {loader, context, props} = this.props;
		let promise = loader(props);

		// Report promise
		promise = context.report(promise);

		// Update state once loaded
		promise.then(
			data => this._loaded(data),
			err => this._errored(err)
		);
	}

	_loaded(data) {
		if (!this._mounted) return;

		this.setState({
			data,
			error: null,
			loading: false,
			loaded: true
		});
	}

	_errored(err) {
		if (!this._mounted) return;

		this.setState({
			data: null,
			error: err,
			loading: false,
			loaded: false
		});
	}

	render() {
		const {state, props} = this;
		if (state.loading || state.error) {
			return <props.Loading loading={state.loading} error={state.error}/>;
		} else if (state.loaded) {
			const componentProps = Object.assign({}, props.props, {[props.dataPropName]: state.data});
			return <props.component {...componentProps}/>;
		} else {
			return null;
		}
	}
}

/**
 * Function to create a loadable data component
 * @param {Object} options
 * @param {Function} options.loader - Loader function - should return Promise
 * @param {React.Component} options.Loading - Component to render while loading
 * @param {React.Component} options.component - Component to render when loaded
 * @param {string} [options.dataPropName='data'] - Prop name to provide data on to component
 */
function LoadableData(options) {
	const {loader, component} = options; // jshint ignore:line
	let {Loading} = options;
	if (!Loading) Loading = () => null;

	let {dataPropName} = options;
	if (dataPropName == null) {
		dataPropName = 'data';
	} else if (typeof dataPropName != 'string') {
		throw new Error('dataPropName must be a string if provided');
	}

	return function(props) {
		return <Consumer>
			{context => (
				<LoadableDataComponent
					loader={loader}
					Loading={Loading}
					component={component}
					dataPropName={dataPropName}
					props={props}
					context={context}
				/>
			)}
		</Consumer>;
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
 * @param {Array} [props.data=[]] - Data array (usually filled by server and passed to client)
 */
function ClientProvider(props) {
	const datas = props.data || [];

	const context = {
		getData: () => {
			if (datas.length == 0) return {loaded: false, data: null};
			return {loaded: true, data: datas.shift()};
		},
		report: promise => promise
	};

	return (
		<Provider value={context}>
			{React.Children.only(props.children)}
		</Provider>
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
 * @param {Array} [props.data=[]] - Data array (usually filled by server and passed to client)
 * @param {Array} [props.promises=[]] - Promises array (must be provided empty)
 */
const fakePromise = {
	then: () => {}
};

function ServerProvider(props) {
	const datas = props.data || [],
		promises = props.promises || [];

	if (promises.length > 0) throw new Error('Promises array must be empty');

	const datasLength = datas.length;

	let getIndex = 0, reportIndex = 0;

	const context = {
		getData: name => {
			if (getIndex >= datasLength) return {loaded: false, data: null};
			return {loaded: true, data: datas[getIndex++]};
		},
		report: promise => {
			const index = reportIndex++;

			// Add promise to array
			// When promise resolves, fetched data is added to data array
			promise = promise.then(data => {
				// Save to datas
				datas[index + datasLength] = data;

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

	return (
		<Provider value={context}>
			{React.Children.only(props.children)}
		</Provider>
	);
}

LoadableData.ServerProvider = ServerProvider;
