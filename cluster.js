#!/usr/bin/env node
/*jslint node: true */
var os = require('os');
var cluster = require('cluster');
var logger = require('loge');
var path = require('path');

var config = require('./package').config;
var port_zero = parseInt(process.env.npm_config_port || config.port, 10);

var optimist = require('optimist')
  .usage('Usage: node cluster.js [options]')
  .describe({
    forks: 'maximum number of workers to spawn',
  })
  .default({forks: os.cpus().length});

var argv = optimist.argv;

cluster.setupMaster({
  exec: path.join(__dirname, 'server.js'),
});
cluster.on('fork', function(worker) {
  logger.debug('cluster: worker[%d] fork (pid=%d)', worker.id, worker.process.pid);
});
cluster.on('disconnect', function(worker) {
  // disconnect occurs slightly before exit.
  logger.error('cluster: worker[%d] disconnect (pid=%d)',
    worker.id, worker.process.pid);
});
cluster.on('exit', function(worker, code, signal) {
  logger.error('cluster: worker[%d] exit code=%d signal=%s (pid=%d)',
    worker.id, code, signal, worker.process.pid);
  // fork new worker to replace dead one
  cluster.fork({npm_config_port: worker.port});
});
cluster.on('listening', function(worker, address) {
  logger.debug('cluster: worker[%d] listening %s @ %s:%s (pid=%d)', worker.id,
    address.addressType, address.address, address.port, worker.process.pid);
});

// fork initial workers
logger.info('Starting cluster with %d forks', argv.forks);
for (var i = 0; i < argv.forks; i++) {
  var worker = cluster.fork({npm_config_port: port_zero + i});
  worker.port = port_zero + i;
}
