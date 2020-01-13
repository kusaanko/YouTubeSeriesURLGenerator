// ==UserScript==
// @name         YouTube Series URL Generator
// @namespace    https://github.com/kusaanko/YouTubeSeriesURLGenerator
// @version      0.5
// @description  YouTubeのシリーズ物の説明文を記入するのを手助けします。
// @author       Kusaanko
// @match        https://studio.youtube.com/channel/*/*
// @grant        none
// @require      https://code.jquery.com/jquery-3.4.1.min.js
// @license      Apache License 2.0
// ==/UserScript==

(function() {
    'use strict';

    var appVer = GM_info.script.version;
    var buildNumber = 1;
    var version = 1;
    var title;
    var timer = true;
    var dbVersion = 1;
    var dbName = "youtubeseriesurlgenerator";
    var channelID = location.href;

    var titleSelector = 'ytcp-mention-textbox[label="タイトル"] #textbox';
    var descSelector = 'ytcp-mention-textbox[label="説明"]';
    var descAreaSelector = descSelector + ' #textbox';

    var removeKey, preurl_bkup;
    channelID = channelID.replace('https://studio.youtube.com/channel/', '');
    channelID = channelID.substring(0, channelID.indexOf('/'));

    var update = function() {
        $.ajax({
            url:"https://api.github.com/repos/kusaanko/YouTubeSeriesURLGenerator/releases/latest",
            type:"GET",
            dataType:"json",
            timespan:2000
        }).done(function(data) {
            var latestBuildNumber = data["name"];
            latestBuildNumber = latestBuildNumber.substring(latestBuildNumber.indexOf('(build')+6, latestBuildNumber.indexOf(')'));
            if(parseInt(latestBuildNumber)>buildNumber) {
                const a = document.createElement("a");
                a.href = data["assets"][0]["browser_download_url"];
                a.target = "_blank";
                a.rel = "noopener";
                a.click();
            }
        });
    };
    update();

    var startChecker = function() {
        setInterval(function() {
            if(location.href.indexOf('/videos/upload?d=ud')==-1) {
                timer = true;
                preurl_bkup = undefined;
                return;
            }
            title = $(titleSelector).html();
            if(!title) {
                timer = true;
                preurl_bkup = undefined;
            }
            if(title&&timer) {
                console.log(getMovieURL());
                $(descSelector).css('height', '300px');
                var position = $(descSelector);
                position.after('<div id="youtubeseriesurlgenerator" style="margin: 40 0;"></div>');
                var view = $('#youtubeseriesurlgenerator');
                view.append('<h2 style="font-family: \'YT Sans\', \'Roboto\', \'Arial\', sans-serif;">YouTube Series URL Generator(v'+appVer+')</h2>'+
                            '<div style="margin: 0;color: red;display: none;" id="youtubeseriesurlgenerator_notice"><p>注意:CCleaner等のクリーンアプリでChromeのデータを削除しないで下さい。</p>'+
                            '<p>消し方によってはシリーズのデータが消滅します。</p><p>クリーナーアプリを実行する際はシリーズの保存・復元をご利用ください。</p><p>この表示は今回・アップデート時のみ表示されます。</p></div>'+
                            '<p><a href="https://github.com/kusaanko/YouTubeSeriesURLGenerator/wiki" target="_blank" rel="noopener">ヘルプ</a></p>'+
                            '<a href="https://github.com/kusaanko/YouTubeSeriesURLGenerator/issues" target="_blank" rel="noopener">問題を報告する</a>'+
                            '<p style="margin: 0;">シリーズを選択</p>'+
                            '<p style="margin: 0;"><select id="youtubeseriesurlgenerator_chooseseries" style="width: 100%;"></select></p>'+
                            '<p style="margin: 0;"><a href="" style="text-decoration: none;color: #3db1d4;" id="youtubeseriesurlgenerator_series">新しいシリーズを追加</a></p>'+
                            '<p style="margin: 0;"><a href="" style="text-decoration: none;color: #3db1d4;" id="youtubeseriesurlgenerator_series_edit">このシリーズを編集</a></p>'+
                            '<p style="margin: 0;"><a href="" style="text-decoration: none;color: #3db1d4;" id="youtubeseriesurlgenerator_series_preurl_edit">このシリーズの前回の動画の編集画面を開く</a></p>'+
                            '<dialog id="youtubeseriesurlgenerator_dialognewseries"><a href="https://github.com/kusaanko/YouTubeSeriesURLGenerator/wiki#%E6%96%B0%E3%81%97%E3%81%84%E3%82%B7%E3%83%AA%E3%83%BC%E3%82%BA%E3%82%92%E8%BF%BD%E5%8A%A0" target="_blank" rel="noopener">ヘルプ</a>'+
                            '<table><tr><td>シリーズ名</td><td><input id="youtubeseriesurlgenerator_series_seriesname" type="text"></td></tr>'+
                            '<tr><td>判断基準(ワイルドカード)</td><td><input id="youtubeseriesurlgenerator_series_check" type="text"></td></tr>'+
                            '<tr><td>前回の動画URL(ある場合)</td><td><input id="youtubeseriesurlgenerator_series_preurl" type="text"></td></tr></table>'+
                            '<p>このシリーズの説明文</p><div><textarea id="youtubeseriesurlgenerator_series_desc" rows="10" style="width: 100%;"></textarea></div>'+
                            '<p>説明文を固定説明文の<select id="youtubeseriesurlgenerator_series_desc_position"><option>前</option><option>後</option></select>に記述する</p>'+
                            ''+
                            '<menu><ytcp-button id="youtubeseriesurlgenerator_series_remove" style="margin: 0 5px;background-color: #ff2323;" label="削除" class="style-scope ytcp-uploads-dialog" tabindex="0" aria-disabled="false" icon-alignment="start" raised="" role="button">'+
                            '<div class="label style-scope ytcp-button">削除</div><paper-ripple class="style-scope ytcp-button">'+
                            '<div id="background" class="style-scope paper-ripple" style="opacity: 0.0011;"></div>'+
                            '<div id="waves" class="style-scope paper-ripple"></div>'+
                            '</paper-ripple></ytcp-button>'+
                            '<ytcp-button id="youtubeseriesurlgenerator_series_cancel" style="margin: 0 5px;background-color: #b9b9b9;" label="キャンセル" class="style-scope ytcp-uploads-dialog" tabindex="0" aria-disabled="false" icon-alignment="start" raised="" role="button">'+
                            '<div class="label style-scope ytcp-button">キャンセル</div><paper-ripple class="style-scope ytcp-button">'+
                            '<div id="background" class="style-scope paper-ripple" style="opacity: 0.0011;"></div>'+
                            '<div id="waves" class="style-scope paper-ripple"></div></paper-ripple></ytcp-button>'+
                            '<ytcp-button style="margin: 0 5px;" id="youtubeseriesurlgenerator_series_ok" label="完了" class="style-scope ytcp-uploads-dialog" tabindex="0" aria-disabled="false" icon-alignment="start" raised="" role="button">'+
                            '<div class="label style-scope ytcp-button">完了</div><paper-ripple class="style-scope ytcp-button">'+
                            '<div id="background" class="style-scope paper-ripple" style="opacity: 0.0011;"></div>'+
                            '<div id="waves" class="style-scope paper-ripple"></div>'+
                            '</paper-ripple></ytcp-button></menu></dialog>'+
                            '<ytcp-button id="youtubeseriesurlgenerator_write" label="説明文に記入する" class="style-scope ytcp-uploads-dialog" tabindex="0" aria-disabled="false" icon-alignment="start" raised="" role="button">'+
                            '<div class="label style-scope ytcp-button">説明文に記入する</div><paper-ripple class="style-scope ytcp-button">'+
                            '<div id="background" class="style-scope paper-ripple" style="opacity: 0.0011;"></div>'+
                            '<div id="waves" class="style-scope paper-ripple"></div></paper-ripple></ytcp-button>'+
                            '<p style="margin: 0;"><a href="" style="text-decoration: none;color: #3db1d4;" id="youtubeseriesurlgenerator_series_save">シリーズをファイルに保存</a></p>'+
                            '<p style="margin: 0;"><a href="" style="text-decoration: none;color: #3db1d4;" id="youtubeseriesurlgenerator_series_load">ファイルからシリーズを復元</a></p>');
                view.append('<div id="youtubeseriesurlgenerator_preurl_updated" style="display: none;">前回のURLをこの動画に更新しました。<a href="" style="text-decoration: none;color: #ff0000;" id="youtubeseriesurlgenerator_series_preurl_undo">元に戻す</a><p style="margin: 0;"></p></div>');
                view.append('<input id="youtubeseriesurlgenerator_series_file" type="file" accept=".ytsug" style="display: none;">');
                $("#youtubeseriesurlgenerator_series_edit").off("click");
                $("#youtubeseriesurlgenerator_series_cancel").off("click");
                $("#youtubeseriesurlgenerator_series_ok").off("click");
                $("#youtubeseriesurlgenerator_series_preurl_edit").off("click");
                $("#youtubeseriesurlgenerator_series_load").off("click");
                $("#youtubeseriesurlgenerator_series_save").off("click");
                $('#youtubeseriesurlgenerator_series_edit').click(function() {
                    removeKey = Base64.encode($('#youtubeseriesurlgenerator_chooseseries').val());
                    $('#youtubeseriesurlgenerator_series_remove').css('display', '');
                    document.getElementById('youtubeseriesurlgenerator_dialognewseries').showModal();
                    var openReq  = indexedDB.open(dbName, dbVersion);

                    openReq.onsuccess = function(event){
                        var db = event.target.result;

                        var transaction = db.transaction([channelID], "readwrite");

                        var store = transaction.objectStore(channelID);
                        store.get(Base64.encode($('#youtubeseriesurlgenerator_chooseseries').val())).onsuccess = function(event){
                            var result = event.target.result;
                            $('#youtubeseriesurlgenerator_series_seriesname').val($('#youtubeseriesurlgenerator_chooseseries').val());
                            $('#youtubeseriesurlgenerator_series_check').val(result.wildcard);
                            $('#youtubeseriesurlgenerator_series_desc').val(result.desc);
                            $('#youtubeseriesurlgenerator_series_preurl').val(result.preurl);
                            $('#youtubeseriesurlgenerator_series_desc_position').val(result.pos);
                        }
                        db.close();
                    }
                    DBError(openReq);
                });
                $('#youtubeseriesurlgenerator_series_cancel').click(function() {
                    document.getElementById('youtubeseriesurlgenerator_dialognewseries').close();
                    removeKey = undefined;
                });
                $('#youtubeseriesurlgenerator_series_ok').click(function() {
                    if(removeKey) {
                        removeDB(removeKey);
                        removeKey = undefined;
                    }
                    document.getElementById('youtubeseriesurlgenerator_dialognewseries').close();
                    updateDB();
                    addDB($('#youtubeseriesurlgenerator_series_seriesname').val(), $('#youtubeseriesurlgenerator_series_check').val(), $('#youtubeseriesurlgenerator_series_preurl').val(), $('#youtubeseriesurlgenerator_series_desc').val(),
                          $('#youtubeseriesurlgenerator_series_desc_position').val());
                    updateDB();
                });
                $('#youtubeseriesurlgenerator_series_preurl_edit').click(function() {
                    var openReq  = indexedDB.open(dbName, dbVersion);

                    openReq.onsuccess = function(event){
                        var db = event.target.result;

                        var transaction = db.transaction([channelID], "readwrite");

                        var store = transaction.objectStore(channelID);
                        store.get(Base64.encode($('#youtubeseriesurlgenerator_chooseseries').val())).onsuccess = function(event){
                            var result = event.target.result;
                            var url = result.preurl;
                            if(url=='') {
                                alert('前回の動画が設定してありません。');
                                return;
                            }
                            url = url.replace(/https?:\/\/youtu.be\//, '').replace(/https?:\/\/(www\.)?youtube\.(com|co\.jp)\/watch\?v=/, '');
                            if(url.indexOf('&')!=-1) url = url.substring(0, url.indexOf('&'));
                            const a = document.createElement("a");
                            a.href = 'https://studio.youtube.com/video/'+url+'/edit';
                            a.target = "_blank";
                            a.rel = "noopener";
                            a.click();
                        }
                        db.close();
                    }
                    DBError(openReq);
                });
                $('#youtubeseriesurlgenerator_series_remove').click(function() {
                    if(window.confirm($('#youtubeseriesurlgenerator_series_seriesname').val()+'を本当に削除しますか？')) {
                        document.getElementById('youtubeseriesurlgenerator_dialognewseries').close();
                        removeDB(Base64.encode($('#youtubeseriesurlgenerator_series_seriesname').val()));
                    }
                });
                $('#youtubeseriesurlgenerator_series').click(function() {
                    document.getElementById('youtubeseriesurlgenerator_dialognewseries').showModal();
                    $('#youtubeseriesurlgenerator_series_seriesname').val(title);
                    $('#youtubeseriesurlgenerator_series_check').val(title);
                    $('#youtubeseriesurlgenerator_series_desc').val('Part1→'+getMovieURL()+'\n\n前→[part]\n次→まだ');
                    $('#youtubeseriesurlgenerator_series_remove').css('display', 'none');
                });
                $('#youtubeseriesurlgenerator_write').click(function() {
                    var openReq  = indexedDB.open(dbName, dbVersion);

                    openReq.onsuccess = function(event){
                        var db = event.target.result;

                        var transaction = db.transaction([channelID], "readwrite");

                        var store = transaction.objectStore(channelID);
                        store.get(Base64.encode($('#youtubeseriesurlgenerator_chooseseries').val())).onsuccess = function(event){
                            var result = event.target.result;
                            var textarea = $(descAreaSelector);
                            textarea.focus();
                            if(result.pos=='前') textarea.html(result.desc.replace("[part]", result.preurl) + "\n" + textarea.html());
                            else textarea.html(textarea.html() + "\n" + result.desc.replace("[part]", result.preurl));
                            if(!preurl_bkup) preurl_bkup = {key: result.key, url: result.preurl};
                            addDB(Base64.decode(result.key), result.wildcard, getMovieURL(), result.desc, result.pos);
                            $('#youtubeseriesurlgenerator_preurl_updated').css('display', 'inline');
                            alert('説明文に文字をなにか適当に入力して削除し、ドラフトを保存しています...となるようにしてください。');
                        }
                        db.close();
                    }
                    DBError(openReq);
                });
                $('#youtubeseriesurlgenerator_series_preurl_undo').click(function() {
                    var openReq  = indexedDB.open(dbName, dbVersion);

                    openReq.onsuccess = function(event){
                        var db = event.target.result;

                        var transaction = db.transaction([channelID], "readwrite");

                        var store = transaction.objectStore(channelID);
                        store.get(preurl_bkup.key).onsuccess = function(event){
                            var result = event.target.result;
                            addDB(Base64.decode(result.key), result.wildcard, preurl_bkup.url, result.desc, result.pos);
                            preurl_bkup = undefined;
                        }
                        db.close();
                    }
                    DBError(openReq);
                    $('#youtubeseriesurlgenerator_preurl_updated').css('display', 'none');
                });
                $('#youtubeseriesurlgenerator_series_save').click(function() {
                    var openReq = indexedDB.open(dbName, dbVersion);

                    openReq.onsuccess = function(event){
                        var db = event.target.result;

                        var transaction = db.transaction([channelID], "readwrite");

                        var store = transaction.objectStore(channelID);
                        store.getAll().onsuccess = function(event){
                            var result = event.target.result;
                            var a = document.createElement('a');
                            a.href = URL.createObjectURL(new Blob([JSON.stringify(result)], {type: 'text/plain'}));
                            a.download = 'series.ytsug';

                            a.style.display = 'none';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            db.close();
                        }
                    }
                    DBError(openReq);
                });
                $('#youtubeseriesurlgenerator_series_load').click(function() {
                    $('#youtubeseriesurlgenerator_series_file').click();
                });
                $('#youtubeseriesurlgenerator_series_file').change(function(e) {
                    if ($('#youtubeseriesurlgenerator_series_file').val()!=='') {
                        var files = e.target.files; // FileList object

                        if(files[0].name.indexOf('.ytsug')==-1) {
                            alert('.ytsug形式を選択してください。');
                            return;
                        }
                        var file_reader = new FileReader();

                        file_reader.onload = function(e){
                            var openReq  = indexedDB.open(dbName, dbVersion);

                            openReq.onsuccess = function(event){
                                var db = event.target.result;

                                var transaction = db.transaction([channelID], "readwrite");

                                var store = transaction.objectStore(channelID);
                                store.clear();
                                var data = JSON.parse(file_reader.result);
                                for(var d in data) {
                                    store.put(data[d]);
                                }
                                db.close();
                            }
                            DBError(openReq);
                        };
                        file_reader.readAsText(files[0]);
                    }
                });
                updateDB();
                timer = false;
            }
        }, 100);
    };
    var DBError = function(openReq) {
        openReq.onerror = function(event){
            alert('YouTube Series URL Generator(v'+appVer+')\nエラーが発生しました。エラーコード:'+event.target.errorCode);
        };
    };
    var getMovieURL = function() {
        return $('#details > ytcp-video-metadata-info > div > div.row.style-scope.ytcp-video-metadata-info > div.left.style-scope.ytcp-video-metadata-info > div.value.style-scope.ytcp-video-metadata-info > span > a').text().replace(/\n/g, '').replace(/\s+/g,'');
    };
    var updateDB = function() {
        var openReq  = indexedDB.open(dbName, dbVersion);

        openReq.onupgradeneeded = function(event){
            var db = event.target.result;
            db.createObjectStore(channelID, {keyPath : 'key'});
            $('#youtubeseriesurlgenerator_notice').show();
        }
        openReq.onsuccess = function(event){
            var db = event.target.result;

            var transaction = db.transaction([channelID], "readwrite");

            var store = transaction.objectStore(channelID);
            var getAllKeysRequest = store.getAllKeys();
            getAllKeysRequest.onsuccess = function() {
                $('#youtubeseriesurlgenerator_chooseseries').html('');
                var selected = false;
                for(let key of getAllKeysRequest.result) {
                    var getReq = store.get(key);

                    var result;
                    getReq.onsuccess = function(event){
                        result = event.target.result;
                        var isMatch = wildcard(title, result.wildcard);
                        $('#youtubeseriesurlgenerator_chooseseries').append('<option '+(!isMatch||selected?'':'selected')+'>'+Base64.decode(key)+'</option>');
                        if(isMatch) selected = true;
                    }
                }
            }
            db.close();
        }
        DBError(openReq);
    };
    var addDB = function(name, wildcard, preurl, desc, pos) {
        var openReq  = indexedDB.open(dbName, dbVersion);

        openReq.onsuccess = function(event){
            var db = event.target.result;

            var transaction = db.transaction([channelID], "readwrite");

            var store = transaction.objectStore(channelID);
            store.put({key: Base64.encode(name), wildcard: wildcard, preurl: preurl, desc: desc, pos: pos});
            db.close();
        }
        DBError(openReq);
    };
    var removeDB = function(key) {
        var openReq = indexedDB.open(dbName, dbVersion);

        openReq.onsuccess = function(event){
            var db = event.target.result;

            var transaction = db.transaction([channelID], "readwrite");

            var store = transaction.objectStore(channelID);
            store.delete(key);
            db.close();
            updateDB();
        }
        DBError(openReq);
    };
    startChecker();

    var Base64 = {
        encode: function(str) {
            return btoa(unescape(encodeURIComponent(str)));
        },
        decode: function(str) {
            return decodeURIComponent(escape(atob(str)));
        }
    };
    var wildcard = function (str, rule) {
        var escapeRegex = (str) => str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
        return new RegExp("^" + rule.split("*").map(escapeRegex).join(".*") + "$").test(str);
    };
})();