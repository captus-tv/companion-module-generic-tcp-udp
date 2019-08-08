var tcp           = require('../../tcp');
var udp           = require('../../udp');
var instance_skel = require('../../instance_skel');
var debug;
var log;

function instance(system, id, config) {
	var self = this;

	// super-constructor
	instance_skel.apply(this, arguments);

	self.actions(); // export actions

	return self;
}

instance.prototype.updateConfig = function(config) {
	var self = this;

	if (self.socket !== undefined) {
		self.socket.destroy();
		delete self.socket;
	}

	self.config = config;

	self.init_socket();
	self.actions();
}

instance.prototype.init = function() {
	var self = this;

	self.status(self.STATE_OK);

	debug = self.debug;
	log = self.log;

	self.init_socket();
}

instance.prototype.init_socket = function() {
	var self = this;

	if (self.socket !== undefined) {
		self.socket.destroy();
		delete self.socket;
	}

	self.status(self.STATE_WARNING, 'Connecting');

	if (self.config.host !== undefined && self.config.port !== undefined) {

		if (self.config.type == 'tcp') {
			self.socket = new tcp(self.config.host, self.config.port, { reconnect_interval:5000 });
		}
		else if (self.config.type == 'udp') {
			self.socket = new udp(self.config.host, self.config.port);
		}

		self.socket.on('error', function (err) {
			debug("Network error", err);
			self.status(self.STATE_ERROR, err);
			self.log('error',"Network error: " + err.message);
		});

		// If we get data, thing should be good
		self.socket.on('data', function (data) {
			self.status(self.STATE_OK);
			console.log("data: "+ data);
		});

		self.socket.on('status_change', function (status, message) {
			self.status(status, message);
		});
	}
};

// Return config fields for web config
instance.prototype.config_fields = function () {
	var self = this;
	return [
		{
			type: 'text',
			id: 'info',
			width: 12,
			label: 'Information',
			value: '<strong>PLEASE READ THIS!</strong> Generic modules is only for use with custom applications. If you use this module to control a device or software on the market that more than you are using, <strong>PLEASE let us know</strong> about this software, so we can make a proper module for it. If we already support this and you use this to trigger a feature our module doesnt support, please let us know. We want companion to be as easy as possible to use for anyone.<br /><br />Use the \'Host/IP\' field below to define the Host or IP of your equipment: e.g. \'10.1.85.20\' or \'host.lan\', and \'Port number\' for the destination port number (0-65535).</b>'
		},
		{
			type: 'textinput',
			id: 'host',
			label: 'Host/IP',
			width: 12
		},
		{
			type: 'textinput',
			id: 'port',
			label: 'Port number',
			width: 5
		},
		{
		  type: 'dropdown',
		  label: 'Type',
		  id: 'type',
		  default: 'tcp',
		  choices: [
		    { id: 'tcp', label: 'TCP' },
		    { id: 'udp', label: 'UDP' }
		  ]
		}
	]
}

// When module gets deleted
instance.prototype.destroy = function() {
	var self = this;

	if (self.socket !== undefined) {
		self.socket.destroy();
	}

	debug("destroy");
}

instance.prototype.actions = function(system) {
	var self = this;

	self.setActions({
		'tcp': {
			label: 'Command',
			options: [
				{
					type: 'textinput',
					label: 'Command',
					id: 'command',
					default: ''
				}
			]
		}
	});
}

instance.prototype.action = function(action) {
	var self = this;
	var cmd = action.options.command;

	if (cmd !== undefined) {
		if (self.socket !== undefined) {

			self.socket.send(cmd);
			self.status('sending ', cmd, " to ", self.config.host, ":", self.config.port);

		}
	}
}

instance_skel.extendedBy(instance);
exports = module.exports = instance;
