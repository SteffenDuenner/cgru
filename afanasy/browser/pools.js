/* ''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''' *\
 *        .NN.        _____ _____ _____  _    _                 This file is part of CGRU
 *        hMMh       / ____/ ____|  __ \| |  | |       - The Free And Open Source CG Tools Pack.
 *       sMMMMs     | |   | |  __| |__) | |  | |  CGRU is licensed under the terms of LGPLv3, see files
 * <yMMMMMMMMMMMMMMy> |   | | |_ |  _  /| |  | |    COPYING and COPYING.lesser inside of this folder.
 *   `+mMMMMMMMMNo` | |___| |__| | | \ \| |__| |          Project-Homepage: http://cgru.info
 *     :MMMMMMMM:    \_____\_____|_|  \_\\____/        Sourcecode: https://github.com/CGRU/cgru
 *     dMMMdmMMMd     A   F   A   N   A   S   Y
 *    -Mmo.  -omM:                                           Copyright © by The CGRU team
 *    '          '
\* ....................................................................................................... */

/*
	pools.js - methods and structs for monitoring and handling of pools
*/

"use strict";

var pools = null;

PoolNode.onMonitorCreate = function() {
	pools = {};
	PoolNode.createParams();
};

function PoolNode()
{
}

PoolNode.prototype.init = function() {
	this.element.classList.add('pool');

	this.elName = document.createElement('span');
	this.elName.classList.add('name');
	this.element.appendChild(this.elName);
	this.elName.title = 'Pool name (path)';

	this.elPriority = cm_ElCreateFloatText(this.element, 'right', 'Priority');

	this.element.appendChild(document.createElement('br'));

	this.elFlags = cm_ElCreateFloatText(this.element, 'left', 'Flags');
	this.elPoolsCounts = cm_ElCreateFloatText(this.element, 'left', 'Pools: All/Running');
	this.elRendersCounts = cm_ElCreateFloatText(this.element, 'left', 'Renders: All/Running');

	this.elRunningCounts = cm_ElCreateFloatText(this.element, 'right');

	this.elAnnotation = document.createElement('div');
	this.element.appendChild(this.elAnnotation);
	this.elAnnotation.classList.add('annotation');
	this.elAnnotation.title = 'Annotation';
};

PoolNode.prototype.update = function(i_obj) {
	if (i_obj)
		this.params = i_obj;


	// Sort needed to force sort by this first:
	this.sort_force = this.params.name;


	// Offset hierarchy:
	this.pool_depth = 0;
	pools[this.params.name] = this;
	var parent_pool = pools[this.params.parent];
	if (parent_pool)
		this.pool_depth = parent_pool.pool_depth + 1;
	this.element.style.marginLeft = (this.pool_depth * 32 + 2) + 'px';


	// Offset child renders hierarchy:
	if (renders_pools[this.params.name])
		for (let render of renders_pools[this.params.name])
			render.offsetHierarchy();
			//^ this function requires filled in pools object


	if (cm_IsPadawan())
	{
		this.elPriority.innerHTML = ' Priority:<b>' + this.params.priority + '</b>';
	}
	else if (cm_IsJedi())
	{
		this.elPriority.innerHTML = ' Pri:<b>' + this.params.priority + '</b>';
	}
	else
	{
		this.elPriority.innerHTML = '-<b>' + this.params.priority + '</b>';
	}


	// Add/Remove CSS classes to highlight/colorize/mute:
	if (this.params.renders_total == null)
	{
		this.element.classList.add('empty');
		this.elFlags.style.display = 'none';
	}
	else
	{
		this.element.classList.remove('empty');
		this.elFlags.style.display = 'block';
	}
	if (this.params.running_tasks_num)
		this.element.classList.add('running');
	else
		this.element.classList.remove('running');


	this.elName.innerHTML = '<b>' + cm_PathBase(this.params.name) + '/</b>';

	var flags = '';
	var flags_tip = 'Flags:';
	if (this.params.create_childs)
	{
		flags += ' <b>ACC</b>';
		flags_tip += '\nAuto create childs';
	}
	else
	{
		flags_tip += '\nDo not create childs';
	}

	this.elFlags.innerHTML = flags;
	this.elFlags.title = flags_tip;

	if (cm_IsPadawan())
	{
		var renders = '';
		if (this.params.renders_total)
		{
			renders += 'Renders Total:';
			renders += ' <b>' + this.params.renders_total + '</b>';
		}
		else
		if (this.params.running_renders_num)
			renders += ' / <b>' + this.params.running_renders_num + '</b> Running';
		this.elRendersCounts.innerHTML = renders;

		var counts = '';
		if (this.params.pools_total)
			counts = 'Pools Total: <b>' + this.params.pools_total + '</b>';
		this.elPoolsCounts.innerHTML = counts;
	}
	else if (cm_IsJedi())
	{
		var renders = 'Renders:';
		if (this.params.renders_total)
			renders += ' <b>' + this.params.renders_total + '</b>';
		else
			renders += ' <b>0</b>';
		if (this.params.running_renders_num)
			renders += ' / <b>' + this.params.running_renders_num + '</b> Run';
		this.elRendersCounts.innerHTML = renders;

		var counts = '';
		if (this.params.pools_total)
			counts = 'Pools: <b>' + this.params.pools_total + '</b>';
		this.elPoolsCounts.innerHTML = counts;
	}
	else
	{
		var renders = 'j:';
		if (this.params.renders_total)
			renders += '<b>' + this.params.renders_total + '</b>';
		else
			renders += '<b>0</b>';
		if (this.params.running_renders_num)
			renders += ' / <b>' + this.params.running_renders_num + '</b>r';
		this.elRendersCounts.innerHTML = renders;

		var counts = '';
		if (this.params.pools_total)
			counts = 'b:<b>' + this.params.pools_total + '</b>';
		this.elPoolsCounts.innerHTML = counts;
	}

	if (this.params.annotation)
		this.elAnnotation.innerHTML = this.params.annotation;
	else
		this.elAnnotation.textContent = '';

	this.refresh();
};

PoolNode.prototype.refresh = function() {
	var percent = '';
	var label = '';
	if (this.params.running_tasks_num && (this.monitor.max_tasks > 0))
	{
		percent = 100 * this.params.running_tasks_num / this.monitor.max_tasks;
		var capacity = cm_ToKMG(this.params.running_capacity_total);
		if (cm_IsPadawan())
			label = 'Running Tasks: <b>' + this.params.running_tasks_num + '</b> / Total Capacity: <b>' +
				capacity + '</b>';
		else if (cm_IsJedi())
			label = 'Tasks:<b>' + this.params.running_tasks_num + '</b> / Capacity:<b>' + capacity + '</b>';
		else
			label = 't<b>' + this.params.running_tasks_num + '</b>/c<b>' + capacity + '</b>';
	}
	else
		percent = '0';
};

PoolNode.createPanels = function(i_monitor) {

	var acts = {};

	acts.add_pool = {
		'label': 'ADD',
		'node_type': 'pools',
		'handle': 'addPoolDialog',
		'tooltip': 'Add pool'};

	i_monitor.createCtrlBtns(acts);
};

PoolNode.prototype.updatePanels = function() {
	// Info:
	var info = '';
	info += '<p>ID = ' + this.params.id + '</p>';
	info += '<p>Created at: ' + cm_DateTimeStrFromSec(this.params.time_creation) + '</p>';
	if (this.params.time_empty)
	{
		info += '<p>Empty for: ' + cm_TimeStringInterval(this.params.time_empty);
		info += ', since: ' + cm_DateTimeStrFromSec(this.params.time_empty) + '</p>';
	}
	this.monitor.setPanelInfo(info);
};

// RenderNode here! This not an error!
// We can't use PoolNode as this is not prototype function.
RenderNode.addPoolDialog = function(i_args) {
	new cgru_Dialog({
		"wnd": i_args.monitor.window,
		"receiver": i_args.monitor.cur_item,
		"handle": 'addPoolDo',
		"param": i_args.name,
		"name": 'add_pool',
		"title": 'Add a child pool to this poll',
		"info": 'Enter a new child pool name:'
	});
};

PoolNode.prototype.addPoolDo = function(i_value, i_name) {
	g_Info('Adding a pool "' + i_value + '" to "' + this.params.name + '"');
	var operation = {};
	operation.type = 'add_pool';
	operation.name = i_value;
	nw_Action('pools', [this.monitor.getSelectedIds()[0]], operation, null);
};

PoolNode.prototype.onDoubleClick = function(e) {
	g_ShowObject({"object": this.params}, {"evt": e, "wnd": this.monitor.window});
};

PoolNode.params_pool = {};

PoolNode.createParams = function() {
	if (PoolNode.params_created)
		return;

	PoolNode.params = {};
	for (var p in work_params)
		PoolNode.params[p] = work_params[p];
	for (var p in PoolNode.params_pool)
		PoolNode.params[p] = PoolNode.params_pool[p];

	PoolNode.params_created = true;
};

