'use strict';

// Modules
const React = require('react'),
	{Fragment} = React;
const {inspect} = require('util');

const LoadableData = require('../');

// Exports

function Loady(props) {
	return <p>{inspect(props)}</p>;
}

const LoadyWithData = LoadableData({ // jshint ignore:line
	loader: props => {
		console.log('loader called with:', {props});
		return Promise.resolve(Object.assign({c: 789}, props))
	},
	component: Loady,
	Loading: () => <div>Loading...</div>
});

function App() {
	return (
		<Fragment>
			<h1>Lets try server render</h1>
			<LoadyWithData a={123} b={456}/>
		</Fragment>
	);
}

module.exports = App;
