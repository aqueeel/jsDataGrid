(function($, window, document, undefined) {

  var pluginName = "editable",
    defaults = {
      keyboard: true,
      dblclick: true,
      button: true,
      addButton: ".add",
      editButton: ".edit",
      deleteButton: ".delete",
      maintainWidth: true,
      resetAfterAddition: true,
      dropdowns: {},
      theme: '',
      iconLibrary: 'font-awesome',
      add: function() {},
      validate: function() {
        return true;
      },
      edit: function() {},
      save: function() {},
      cancel: function() {},
      deleteRow: function() {},
      getData: function() {}
    };

  var _data = [];
  //
  function editable(element, options, table) {
    this.element = element;
    this.options = $.extend({}, defaults, options);
    this.table = table;
    this.addForm = $('.add-form', table);

    this._defaults = defaults;
    this._name = pluginName;

    this.init();
  }

  function _editable(element, options) {

    if($(element).length === 0) {
      return null;
    }

    return $(element).find('tr').each(function() {
      if (!$.data(this, "plugin_" + pluginName)) {
        $.data(this, "plugin_" + pluginName,
          new editable(this, options, $(element)));
      }
    });

  }
  /*
   *  get data of each row
   * @ returns array of objecs
   *
   */

  function getData() {
    return _data;
  }
  /*
   *  make the data array to
   *  empty array
   */

  function resetData(element) {
    _data = [];
    $(element).find('tbody tr').not('.add-form').remove();
  }
  /*
   *  removes an object from data
   *  by checking its id
   *  @params 1 : id
   */

  function removeData(id) {

      index = _data.findIndex(function(obj){
          return obj.id == id;
      });
      _data.splice(1,index);
      return _data;
  }

  /*
   *  generate unique id for each row
   * @ returns alpha numeric string
   *
   */

  function uuid() {

    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
      s4() + '-' + s4() + s4() + s4();

  }
  /*
   *  editable prototypes
   *
   */
  editable.prototype = {

    _actionColumn: function() {
      this._getIcons();
      return (
        '<td>' +
        '<a style="white-space: nowrap;padding:5px;" class="' + this._defaults.editButton.substr(1) + '" title="Edit">' +
        '<i class="fa ' + this.icon.edit + '"></i>' +
        '</a>' +
        '<a style="white-space: nowrap;padding:5px;" class="' + this._defaults.deleteButton.substr(1) + '" title="Delete">' +
        '<i class="fa ' + this.icon.delete + '"></i>' +
        '</a>' +
        '</td >'
      );
    },
    init: function() {
      this.editing = false;

      var instance = this;
      if (this.options.dblclick) {
        $(this.element)
          .not('.add-form')
          .css('cursor', 'pointer')
          .bind('dblclick', this.toggleEdit.bind(this));
      }
      // binding toggle function to edit and delete buutons
      if (this.options.button) {

        $(this.options.editButton, this.element)
          .not('.add-form')
          .bind('click', this.toggleEdit.bind(this));
        $(this.options.deleteButton, this.element)
          .not('.add-form')
          .bind('click', this.toggleDelete.bind(this));

        if($(this.element).hasClass('add-form')) {

          $(this.options.addButton,this.element)
            .bind('click', this.handleAddition.bind(this));
        }

      }

      $(this.element).not('.head').not('.add-form').each(function() {

        // stores the text values in each row
        var values = {};
        // stores the user defined unique id for each row
        var userDefinedUuid =   $(this).attr('data-id');

        if(typeof userDefinedUuid == 'undefined' || userDefinedUuid === ""){
          var uuid = instance._guid();
          $(this).attr('data-id', uuid);
          values.id = uuid;
        } else {
          values.id = userDefinedUuid;
        }


        $(this).children().each(function() {
          var key = $(this).data('field');

          if (key) {
            values[key] = $(this).text().trim();
          }
        });
        _data.push(values);
      });

    },
    _guid: uuid,

    _getIcons: function() {

      switch (this._defaults.iconLibrary) {
        case 'font-awesome':
          this.icon = {
            save: 'fa-save',
            edit: 'fa-pencil',
            cancel: 'fa-remove',
            delete: 'fa-trash'
          };
          break;
        default:
          this.icon = {};
          break;
      }

    },

    _resetIcons: function(action) {
      this._getIcons();

      switch (action) {

        case 'edit':

          $(".edit i", this.element)
            .removeClass(this.icon.edit)
            .addClass(this.icon.save)
            .attr('title', 'Save');
          $(".delete i", this.element)
            .removeClass(this.icon.delete)
            .addClass(this.icon.cancel)
            .attr('title', 'Cancel');
          break;

        case 'save':
          $(".edit i", this.element)
            .removeClass(this.icon.save)
            .addClass(this.icon.edit)
            .attr('title', 'Edit');
          $(".delete i", this.element)
            .removeClass(this.icon.cancel)
            .addClass(this.icon.delete)
            .attr('title', 'Delete');
          break;
        case 'cancel':
          $(".edit i", this.element)
            .removeClass(this.icon.save)
            .addClass(this.icon.edit)
            .attr('title', 'Edit');
          $(".delete i", this.element)
            .removeClass(this.icon.cancel)
            .addClass(this.icon.delete)
            .attr('title', 'Delete');
          break;
        default:

      }

    },
    toggleEdit: function(e) {
      e.preventDefault();

      this.editing = !this.editing;

      if (this.editing) {
        this.edit();
      } else {
        this.save();
      }
    },
    toggleDelete: function(e) {
      e.preventDefault();
      this.editing = !this.editing;
      if (this.editing) {
        this.deleteRow();
      } else {
        this.cancel();
      }
    },
    handleAddition: function(e) {

      e.preventDefault();

      this.add();
    },
    edit: function() {



      this._resetIcons('edit');
      var instance = this,
          displayValues = {},
          values = {};

      $('td[data-field]', this.element).each(function() {


        var input,
          field = $(this).data('field'),
          value = $(this).text(),
          width = $(this).width(),
          disabled = $(this).attr("disabled"),
          dataVal = $(this).attr("data-value"),
          disabledText = '';

        if(typeof disabled != 'undefined') {
            disabledText = 'disabled';
        }

        if(typeof dataVal != 'undefined') {
            values[field] = dataVal;
        } else {
            values[field] = value;
        }

        displayValues[field] = value;

        $(this).empty();

        if (instance.options.maintainWidth) {
          $(this).width(width);
        }

        if (field in instance.options.dropdowns) {
          input = $('<select class="form-control" ' + disabledText + '></select>');


          var options = instance.options.dropdowns[field].map(function(option) {
            return (
              '<option value="' + option.id + '">' + option.text + '</option>'
            );
          });

          input.html(options);

          input.val(value)
            .data('old-value', value)
            .dblclick(instance._captureEvent);
        } else {
          input = $('<input class="form-control" type="text" ' + disabledText + ' />')
            .val(value)
            .data('old-value', value)
            .dblclick(instance._captureEvent);
        }

        input.appendTo(this);

        if (instance.options.keyboard) {
          input.keydown(instance._captureKey.bind(instance));
        }
      });

      this.options.edit.bind(this.element)(values);
    },

    save: function() {

      var instance = this,
        values = {},
        displayValues = {},
        prev = {};


      $('td[data-field]', this.element).each(function() {

        var field = $(this).data('field');

        if (field in instance.options.dropdowns) {
          values[field] = $('select option:selected', this).val();
          displayValues[field] = $('select option:selected', this).text();
          $(this).attr('data-value', values[field]);
        } else {
          values[field] = $('input', this).val();
          displayValues[field] = $('input', this).val();
        }

      });

      if(!instance.options.validate(values)) {
        return;
      }

      $('td[data-field]', this.element).each(function() {
          var field = $(this).data('field');
          prev[field] = $(this).text();
          $(this).empty()
                 .text(displayValues[field]);
      });

      this._resetIcons('save');

      var u_id = $(this.element).data('id');
      values.id = u_id;

      var index = _data.findIndex(function(obj) {
        return obj.id == u_id;
      });

      if (index !== -1) {
        _data[index] = values;
      } else {
        _data.push(values);
      }

      this.options.save.bind(this.element)(displayValues,prev);
    },

    cancel: function() {
      this._resetIcons('cancel');
      var instance = this,
        values = {};

      $('td[data-field]', this.element).each(function() {
        var value = $(':input', this).data('old-value');

        values[$(this).data('field')] = value;

        $(this).empty()
          .text(value);
      });

      this.options.cancel.bind(this.element)(values);
    },
    add: function() {


      var instance = this;

      var newRow = $('<tr></tr>');
      var u_id = this._guid();
      newRow.attr('data-id', u_id);
      var values = {
        id: u_id
      };

      $('td[data-field]', this.addForm).each(function() {

        var coloumn = $(this).clone();
        coloumn.children().remove();
        var field = $(this).data('field'),
            disabled = $(this).attr('disabled');


        if(typeof disabled != 'undefined') {
          coloumn.attr('disabled','disabled');
        }

        if (field in instance.options.dropdowns) {

          var selectedValue = $('select option:selected', this).val();
          values[field] = selectedValue;
          coloumn.attr('data-value', selectedValue);
          coloumn.text($('select option:selected', this).text());


        } else {
          var inpuValue = $('input', this).val();
          values[field] = inpuValue;
          coloumn.text(inpuValue);
          if (instance.options.resetAfterAddition) {
            $('input', this).val('');
          }
        }
        this.newRow = newRow;
        newRow.append(coloumn);

      });

      if(!instance.options.validate(values)) {
        return;
      }

      newRow.append(this._actionColumn());

      $('tbody', this.table).append(newRow);

      $.data(newRow, "plugin_" + pluginName, new editable(newRow, this.options));

      instance.options.add(values);

    },
    deleteRow: function() {

      var id = $(this.element).attr('data-id');
      var index = _data.findIndex(function(obj) {
        return obj.id == id;
      });

      var deletedObject = _data[index];

      if (index !== -1) {
        _data.splice(index, 1);
      }
      $(this.element).remove();

      this.options.deleteRow(deletedObject,id);
    },
    _captureEvent: function(e) {
      e.stopPropagation();
    },

    _captureKey: function(e) {
      if (e.which === 13) {
        this.editing = false;
        this.save();
      } else if (e.which === 27) {
        this.editing = false;
        this.cancel();
      }
    }
  };

  $.fn[pluginName] = function(options) {

    return this.each(function() {
      if (!$.data(this, "plugin_" + pluginName)) {
        $.data(this, "plugin_" + pluginName,
          new editable(this, options));
      }
    });

  };

  window.editable = function(element, options) {
    var self = {};
    self._editable = _editable(element, options);
    self.getData = getData;
    self.resetData = resetData.bind(this,element);
    self.removeData = removeData;
    self.uuid = uuid;
    return self;
  };



})(jQuery, window, document);
