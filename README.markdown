# Museum jQuery Gallery

Museum is a jQuery gallery optimized for fullscreen navigation, inspired by Guardian gallery system.

&copy; Jari Pennanen, 2016. MIT License.

## Usage

See `index.html` for the working demo. First you must add the museum plugin call with selector to your javascript, e.g.

```javascript
jQuery(".add-to-museum").museum();
```

### HTML syntax of elements, with info buttons

Type the contents of info in the child element with `data-info` attribute.

```html
<a href="image.jpg" class="add-to-museum">
    Image link
    <p data-info>
        Image information, if any, this element is not required
    </p>
</a>
```

### With TOC button

Type the toc item as `data-toc="Text of the toc"`

```html
<a href="image.jpg" data-toc="Toc line of the item" class="add-to-museum">
    Image link
</a>
```

### Creating another gallery instance

Use `data-gallery="identifier"` to identify each gallery

```html
<a data-gallery="another" href="image.jpg" class="add-to-museum">
    Image link
</a>
<a data-gallery="another" href="image2.jpg" class="add-to-museum">
    Image link
</a>
```

### Options for `jQuery.fn.museum()`

```javascript
{
    id? : string = "" // Identifier of the gallery
    classes? : string = "" // Classes given to the museum
    items? : MuseumItem[] = [] // See source code
    circular? : boolean = true // Cyclic next and previous button
    template? : string = defaultTemplate // HTML String, see the source code
    useInfo? : boolean = true // Info is automatic, if any of the items has info it appears
    useToc? : boolean = true // Toc is automatic, if any of the items has toc it appears
}
```