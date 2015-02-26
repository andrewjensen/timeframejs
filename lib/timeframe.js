(function ($) {

	/////////////////////
	// MAIN ENTRY POINT
	/////////////////////

	var Timeframe = function (selector) {
		var element = $(selector);

		var timeline = new Timeline(element);
		return timeline;
	};
	window.Timeframe = Timeframe;

	var defaultOptions = {
		tickHeight: 8,
		textHeight: 10
	};

	///////////////////
	// TIMELINE CLASS
	///////////////////

	var Timeline = function (container) {
		this.container = container;
		this.categories = [];

		this.options = {};
		for (var i in defaultOptions) {
			this.options[i] = defaultOptions[i];
		}

		this.outerWidth = this.container.innerWidth();
		this.outerHeight = 100;
		this.paddingX = 20;
		this.paddingY = 20;

		this.width = this.outerWidth - (this.paddingX * 2);
		this.height = this.outerHeight - (this.paddingY * 2);

		this.container.height(this.outerHeight);

		this.svg = $(svg("svg"))
			.attr("width", this.outerWidth)
			.attr("height", this.outerHeight)
			.appendTo(this.container);
	};

	// Configuration

	Timeline.prototype.start = function (startString) {
		this.startDate = parseDateString(startString);
		return this;
	};

	Timeline.prototype.end = function (endString) {
		this.endDate = parseDateString(endString);
		return this;
	};

	Timeline.prototype.majorTicks = function (number, type) {
		this.options.majorTicks = this.options.majorTicks || {};
		this.options.majorTicks.number = number;
		this.options.majorTicks.type = type;
		return this;
	};

	Timeline.prototype.minorTicks = function (number, type) {
		this.options.minorTicks = this.options.minorTicks || {};
		this.options.minorTicks.number = number;
		this.options.minorTicks.type = type;
		return this;
	};

	Timeline.prototype.autoTicks = function () {
		//TODO: look at the range of dates and adjust accordingly
		this.majorTicks(5, "years");
		this.minorTicks(1, "year");
		return this;
	};

	// Adding items

	Timeline.prototype.addCategory = function (categoryData) {
		console.log("addCategory", categoryData);

		var category = {
			name: categoryData.name,
			color: categoryData.color,
			events: [],
			spans: []
		};
		this.categories.push(category);

		if (categoryData.events && categoryData.events.length) {
			for (var e = 0; e < categoryData.events.length; e++) {
				var event = categoryData.events[e];
				this.addEvent(event, category);
			}
		}

		if (categoryData.spans && categoryData.spans.length) {
			for (var s = 0; s < categoryData.spans.length; s++) {
				var span = categoryData.spans[s];
				this.addSpan(span, category);
			}
		}

		return this;
	};

	Timeline.prototype.addEvent = function (eventData, category) {
		var event = {
			name: eventData.name,
			date: parseDateString(eventData.date)
		};
		category.events.push(event);
	};

	Timeline.prototype.addSpan = function (spanData, category) {
		var span = {
			name: spanData.name,
			start: parseDateString(spanData.start),
			end: parseDateString(spanData.end)
		};
		category.spans.push(span);
	};

	// Rendering

	Timeline.prototype.draw = function () {

		//Prepare to draw first...
		if (!this.options.majorTicks || !this.options.minorTicks) {
			this.autoTicks();
		}

		this.drawBackground();
		this.drawItems();

		return this;
	};

	Timeline.prototype.drawBackground = function () {

		var background = $svg.group()
			.attr("class", "background")
			.appendTo(this.svg);

		var tickHeight = this.options.tickHeight;
		var textHeight = this.options.textHeight;

		var bottomLine = $svg.line(
			this.paddingX,
			this.height + this.paddingY - textHeight - tickHeight - 0.5,
			this.width + this.paddingX,
			this.height + this.paddingY - textHeight - tickHeight - 0.5
		)
			.attr("stroke", "#000000")
			.attr("stroke-width", 1)
			.appendTo(background);

		//Draw the labels and ticks for each year
		for (var year = this.startDate.getFullYear(); year <= this.endDate.getFullYear(); year++) {
			var yearDate = new Date(year, 0, 1);
			var x = Math.floor(this.getX(yearDate)) + 0.5;

			var isMajorTick = (year % this.options.majorTicks.number === 0);

			if (isMajorTick) {
				var yearLabel = $svg.text(
					x,
					this.height + this.paddingY,
					year,
					{
						fill: "black",
						"font-size": "12",
						"text-anchor": "middle"
					}
				)
					.appendTo(background);
			}

			var yearTick = $svg.line(
				x,
				this.height + this.paddingY - textHeight - tickHeight,
				x,
				this.height + this.paddingY - textHeight
			)
				.attr("stroke", "#000000")
				.attr("stroke-width", 1)
				.appendTo(background);
		}
		
		return this;
	};

	Timeline.prototype.drawItems = function () {
		for (var c = 0; c < this.categories.length; c++) {
			var category = this.categories[c];

			for (var e = 0; e < category.events.length; e++) {
				this.drawEvent(category.events[e]);
			}

			for (var s = 0; s < category.spans.length; s++) {
				this.drawSpan(category.spans[s]);
			}
		}
		return this;
	};

	Timeline.prototype.drawEvent = function (event) {
		var x = this.getX(event.date);

		var group = $svg.group()
			.attr("class", "event")
			.appendTo(this.svg);

		var circle = $svg.circle(
			x,
			this.height - this.options.textHeight - this.options.tickHeight + this.paddingY,
			5
		)
			.attr("fill", "black")
			.appendTo(group);

		var label = $svg.text(
			x,
			this.height - this.options.textHeight - this.options.tickHeight + this.paddingY - 8,
			event.name,
			{
				fill: "black",
				"font-size": "12",
				"text-anchor": "middle"
			}
		)
			.appendTo(group);
	};

	Timeline.prototype.drawSpan = function (span) {
		console.log("drawSpan", span);

		var startX = this.getX(span.start);
		var endX = this.getX(span.end);

		var group = $svg.group()
			.attr("class", "span")
			.appendTo(this.svg);

		var rect = $svg.rect(
			startX,
			this.height - this.options.textHeight - this.options.tickHeight + this.paddingY - 4,
			endX - startX,
			7,
			{
				rx: 5,
				ry: 5
			}
		)
			.attr("fill", "black")
			.appendTo(group);

		var label = $svg.text(
			(startX + endX) / 2,
			this.height - this.options.textHeight - this.options.tickHeight + this.paddingY - 8,
			span.name,
			{
				fill: "black",
				"font-size": "12",
				"text-anchor": "middle"
			}
		)
			.appendTo(group);
	};

	// Utilities

	Timeline.prototype.getX = function (date) {
		var dateValue = date.valueOf();
		var start = this.startDate.valueOf();
		var end = this.endDate.valueOf();

		var x = ((dateValue - start) / (end - start) * this.width) + this.paddingX;
		return x;
	};

	////////////
	// HELPERS
	////////////

	var parseDateString = function (dateString) {
		//TODO: make this more robust
		var pieces = dateString.split("-");

		var years = parseInt(pieces[0], 10);
		var months = parseInt(pieces[1], 10) - 1;	//months are 0-based
		var days = parseInt(pieces[2], 10);

		var date = new Date(years, months, days);
		return date;
	};

	var $svg = {};

	$svg.group = function () {
		var element = $(svg("g"));
		return element;
	};

	$svg.line = function (x1, y1, x2, y2, options) {
		var element = $(svg("line"))
			.attr("x1", x1)
			.attr("y1", y1)
			.attr("x2", x2)
			.attr("y2", y2);
		setSvgOptions(element, options);
		return element;
	};

	$svg.circle = function (cx, cy, r, options) {
		var element = $(svg("circle"))
			.attr("cx", cx)
			.attr("cy", cy)
			.attr("r", r);
		setSvgOptions(element, options);
		return element;
	};

	$svg.rect = function (x, y, width, height, options) {
		var element = $(svg("rect"))
			.attr("x", x)
			.attr("y", y)
			.attr("width", width)
			.attr("height", height);
		setSvgOptions(element, options);
		return element;
	};

	$svg.text = function (x, y, text, options) {
		var element = $(svg("text"))
			.attr("x", x)
			.attr("y", y)
			.text(text);
		setSvgOptions(element, options);
		return element;
	};

	function svg(tagName)
	{
		return document.createElementNS('http://www.w3.org/2000/svg', tagName);
	}

	function setSvgOptions(element, options) {
		if (options) {
			for (var i in options) {
				element.attr(i, options[i]);
			}
		}
	}

})(jQuery);
