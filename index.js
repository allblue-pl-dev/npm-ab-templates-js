/* ab-templates-js */

var abFiles = require('ab-fs');
var abWatcher = require('ab-watcher');
var uglifyJS = require('uglify-js');


module.exports = {

    name: 'JS',

    _paths: null,
    _uris: null,
    _watcher: null,

    onBuild: function(tpl) {
        var self = this;
        return new Promise(function(resolve, reject) {
            var fs_paths = self._watcher.getFilePaths();

            /* Log */
            for (var i = 0; i < fs_paths.length; i++)
                tpl.log('    - ' + fs_paths[i]);

            /* Build */
            if (tpl.build.final) {
                var js = '';
                for (var i = 0; i < fs_paths.length; i++)
                    js += abFiles.file.getContents(fs_paths[i]);

                var minified_js = uglifyJS.minify(js, {
                    compress: {
                        dead_code: true,
                        fromString: true,
                        global_defs: {
                            DEBUG: false
                        }
                    }
                });

                abFiles.file.putContents(min_scripts_path, minified_js.code);

                resolve();
            }

            tpl.tasks.buildHeader().call();
        });
    },

    onBuildHeader: function(tpl, header)
    {
        var file_paths = this._watcher.getFilePaths();

        /* Log */
        tpl.log('Scripts:');
        for (var i = 0; i < file_paths.length; i++)
            tpl.log('  - ' + file_paths[i]);

        /* Build */
        if (tpl.build.final) {
            header.addTag('script', {
                src: uri + '?v=' + self.getVersionHash(),
                type: 'text/javascript'
            });
        } else {
            for (var i = 0; i < file_paths.length; i++) {
                header.addTag('script', {
                    src: uri + '?v=' + tpl.getVersionHash(),
                    type: 'text/javascript'
                });
            }
        }
    },

    onClean: function()
    {
        if (abFiles.file_Exists(min_scripts_path))
            abFiles.file_Unlink(min_scripts_path);
    },

    onCreate: function(tpl)
    {
        this._path = tpl.paths.front + '/scripts.min.js';
        this._uris = tpl.uris.front + '/scripts.min.js';
        this._watcher = abWatcher.new();

        if (tpl.build.final) {
            this._watcher.on([ 'add', 'unlink', 'change' ],
                    function(file, evt) {
                tpl.tasks.buildExt('js').call();
            });
        } else {
            this._watcher.on([ 'add', 'unlink' ], function(file, evt) {
                tpl.tasks.buildHeader().call();
            });
        }
    },

    onHeaderBuild: function(tpl, header) {
        var fs_paths = this.watcher.getFilePaths();

        if (tpl.build.final) {
            header.addTag('script', {
                src: uri + '?v=' + tpl.build.hash,
                type: 'text/javascript'
            });
        } else {
            for (var i = 0; i < fs_paths.length; i++) {
                header.addTag('script', {
                    src: uri + '?v=' + tpl.build.hash,
                    type: 'text/javascript'
                });
            }
        }
    },

    onTplChanged: function(tpl, tpl_info) {
        if (!('js' in tpl_info)) {
            this._watcher.clear();
            return;
        }

        this._watcher.update(tpl_info.js);
    }

};
