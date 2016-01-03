var less = process.mainModule.children[2].exports;
less.functions.functionRegistry.add("uri-replace", function(str, rep, context) {
    // Looks like a data uri result
    if (str instanceof less.tree.URL) {
        // Replace all "name='something'" ...
        str.value.value = str.value.value.replace(/([a-z]+)%3D(["'])([^\s]+?)['"]/g, function (original, name, quote, value) {
            if (name in rep.value) {
                return name + "%3D" + quote + encodeURIComponent(rep.value[name]) + quote;
            }                
            return original;
        });
    } 
    return str;
});