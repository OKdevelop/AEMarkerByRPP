//window style
var win = new Window("palette", "メニュー表示", undefined);
win.orientation = "column";

var LABEL_WIDTH = 110;

var select_file = win.add("group", undefined);
select_file.orientation = "row";
select_file.alignment = "left";
var txt_select_file = select_file.add("statictext", undefined, "RPPファイルを選択");
var btn_select_file = select_file.add("button", undefined, "Select");
txt_select_file.preferredSize.width = LABEL_WIDTH;

var maker_start = win.add("group", undefined);
maker_start.orientation = "row";
maker_start.alignment = "left";
var txt_maker_start = maker_start.add("statictext", undefined, "マーカー開始位置");
var ddl_maker_start = maker_start.add("dropdownlist", undefined, ["コンポジションの先頭", "選択レイヤーの先頭", "現在のカーソル"]);
txt_maker_start.preferredSize.width = LABEL_WIDTH;
ddl_maker_start.selection = 0;

var maker_remove = win.add("group", undefined);
maker_remove.orientation = "row";
maker_remove.alignment = "left";
var txt_marker_remove = maker_remove.add("statictext", undefined, "既存のマーカーを削除");
var cbx_marker_remove = maker_remove.add("checkbox", undefined, "");
txt_marker_remove.preferredSize.width = LABEL_WIDTH;

var execution = win.add("button", undefined, "実行");
execution.alignment = "center";

win.center();
win.show();

//functions
var comp = app.project.activeItem;

if (typeof String.prototype.trim !== "function") {
    String.prototype.trim = function () {
        return this.replace(/^\s+|\s+$/g, "");
    };
};

function ceilTo(value, digits) {
    var factor = Math.pow(10, digits);
    return Math.ceil(value * factor) / factor;
};

function fnc_select_file() {
    var file = null;
    while (true) {
        file = File.openDialog("RPPファイルを選択");
        if (!file) {
            alert("キャンセルされました");
            return null;
        }
        var path = file.fullName;
        var ext = path.substring(path.lastIndexOf(".") + 1).toLowerCase();
        if (ext === "rpp") {
            break;
        } else {
            alert("RPPファイルを選択してください");
        }
    }
    return file
}

function fnc_write_marker(file,default_position) {
    file.open("r");
    var lines = file.read().split("\n");
    file.close();
    const trimed_lines = [];
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        trimed_lines.push(line);
    };
    for (var i = 0; i < trimed_lines.length; i++) {
        var line = trimed_lines[i];
        if (line == "<ITEM") {
            if (trimed_lines[i + 18].indexOf("<SOURCE") !== -1) {
                var start_positon = ceilTo((trimed_lines[i + 1].replace("POSITION","")).trim(),2);
                var duration_length = ceilTo((trimed_lines[i + 3].replace("LENGTH","")).trim(),2);
                var file_line = trimed_lines[i + 19];
                var rpp_item_name = file_line.slice(file_line.lastIndexOf("\\") + 1, file_line.lastIndexOf("."));
                if (comp instanceof CompItem) {
                    var marker = new MarkerValue(rpp_item_name);
                    marker.duration = duration_length;
                    comp.markerProperty.setValueAtTime(default_position + start_positon, marker);
                };
            };
        };
    };
};

function fnc_marker_remove(comp) {
    var markerProp = comp.markerProperty;
    var numKeys = markerProp.numKeys;
    for (var i = numKeys; i >= 1; i--) {
        markerProp.removeKey(i);
    };
};

//event_execute
var selected_rpp = null;
btn_select_file.onClick = function() {
    selected_rpp = fnc_select_file();
};

var default_position = 0;
ddl_maker_start.onChange = function() {
    if (ddl_maker_start.selection.index == 0) {
        default_position = 0;
    } else if (ddl_maker_start.selection.index == 1) {
        if (comp instanceof CompItem && comp.selectedLayers.length > 0) {
            var layer = comp.selectedLayers[0];
            default_position = layer.startTime;
        };
    } else if (ddl_maker_start.selection.index == 2) {
        if (comp instanceof CompItem) {
            default_position = comp.time;
        };
    };
};


var bool_remove = false;
cbx_marker_remove.onClick = function() {
  if (cbx_marker_remove.value) {
    bool_remove = true;
  } else {
    bool_remove = false;
  }
};

execution.onClick = function() {
    if (bool_remove) {
        fnc_marker_remove(comp);
    }
    app.beginUndoGroup("マーカー追加");
    fnc_write_marker(selected_rpp,default_position);
    app.endUndoGroup();
}