// Internal Dependencies.
import ColorPicker from '../../components/color-picker';
import dashCaseToTitle from '../../utils/dash-case-to-title';

const { __ } = wp.i18n;

const { Component, Fragment } = wp.element;

const { addFilter } = wp.hooks;

const {
    MediaUpload,
} = wp.editor;

const { hasBlockSupport } = wp.blocks;

const {
    PanelBody,
    ButtonGroup,
    Button,
    BaseControl,
    SelectControl,
    TextControl,
    ColorIndicator,
} = wp.components;

const {
    withSelect,
} = wp.data;

/**
 * Filters registered block settings, extending attributes to include backgrounds.
 *
 * @param  {Object} blockSettings Original block settings
 * @return {Object}               Filtered block settings
 */
export function addAttribute( blockSettings ) {
    if (
        blockSettings.name === 'ghostkit/grid' ||
        blockSettings.name === 'ghostkit/grid-column'
    ) {
        blockSettings.supports.awb = true;
    }

    let allow = false;

    if ( hasBlockSupport( blockSettings, 'awb', false ) ) {
        allow = true;
    }

    if ( allow ) {
        blockSettings.attributes.awb_type = {
            type: 'string',
            default: 'color',
        };
        blockSettings.attributes.awb_align = {
            type: 'string',
        };
        blockSettings.attributes.awb_color = {
            type: 'string',
            default: '',
        };
        blockSettings.attributes.awb_image = {
            type: 'number',
            default: '',
        };
        blockSettings.attributes.awb_imageTag = {
            type: 'string',
            default: '',
        };
        blockSettings.attributes.awb_imageSizes = {
            type: 'object',
            default: '',
        };
        blockSettings.attributes.awb_imageSize = {
            type: 'string',
            default: 'full',
        };
        blockSettings.attributes.awb_imageBackgroundSize = {
            type: 'string',
            default: 'cover',
        };
        blockSettings.attributes.awb_imageBackgroundPosition = {
            type: 'string',
            default: '50% 50%',
        };
    }

    return blockSettings;
}

/**
 * Select image
 *
 * @param {Object} media - media data.
 * @param {Function} setAttributes - function to set attributes on the block.
 */
function onImageSelect( media, setAttributes ) {
    setAttributes( {
        image: '',
        imageSizes: '',
    } );

    wp.media.attachment( media.id ).fetch().then( ( data ) => {
        if ( data && data.sizes ) {
            const url = ( data.sizes[ 'post-thumbnail' ] || data.sizes.medium || data.sizes.medium_large || data.sizes.full ).url;
            if ( url ) {
                setAttributes( {
                    image: media.id,
                    imageSizes: data.sizes,
                } );
            }
        }
    } );
}

class BackgroundControlsInspector extends Component {
    constructor() {
        super( ...arguments );

        this.updateAwbAttributes = this.updateAwbAttributes.bind( this );
        this.onUpdate = this.onUpdate.bind( this );
    }

    componentDidMount() {
        this.onUpdate();
    }
    componentDidUpdate() {
        this.onUpdate();
    }

    updateAwbAttributes( attr ) {
        const {
            setAttributes,
        } = this.props;

        const newAttrs = {};

        Object.keys( attr ).forEach( ( k ) => {
            newAttrs[ `awb_${ k }` ] = attr[ k ];
        } );

        setAttributes( newAttrs );
    }

    onUpdate() {
        const {
            fetchImageTag,
        } = this.props;

        // set image tag to attribute
        if ( fetchImageTag ) {
            this.updateAwbAttributes( { imageTag: fetchImageTag } );
        }
    }

    render() {
        const {
            attributes,
        } = this.props;

        const setAttributes = this.updateAwbAttributes;

        const {
            awb_color: color,
            awb_type: type,
            awb_image: image,
            awb_imageTag: imageTag,
            awb_imageSizes: imageSizes,
            awb_imageSize: imageSize,
            awb_imageBackgroundSize: imageBackgroundSize,
            awb_imageBackgroundPosition: imageBackgroundPosition,
        } = attributes;

        return (
            <PanelBody
                title={ __( 'Background' ) }
                initialOpen={ false }
            >
                <ButtonGroup aria-label={ __( 'Background type' ) } style={ { marginTop: 15, marginBottom: 10 } }>
                    {
                        [
                            {
                                label: __( 'Color' ),
                                value: 'color',
                            },
                            {
                                label: __( 'Image' ),
                                value: 'image',
                            },
                            {
                                label: __( 'Video' ),
                                value: 'yt_vm_video',
                            },
                        ].map( ( val ) => {
                            let selected = type === val.value;

                            // select video
                            if ( val.value === 'yt_vm_video' ) {
                                selected = type === 'video' || type === 'yt_vm_video';
                            }

                            return (
                                <Button
                                    isLarge
                                    isPrimary={ selected }
                                    aria-pressed={ selected }
                                    onClick={ () => setAttributes( { type: val.value } ) }
                                    key={ `type_${ val.label }` }
                                >
                                    { val.label }
                                </Button>
                            );
                        } )
                    }
                </ButtonGroup>

                { ( type === 'image' ) ? (
                    <PanelBody title={ __( 'Image' ) } initialOpen={ type === 'image' }>
                        { /* Select Image */ }
                        { ! image || ! imageTag ? (
                            <MediaUpload
                                onSelect={ ( media ) => {
                                    onImageSelect( media, setAttributes );
                                } }
                                allowedTypes={ [ 'image' ] }
                                value={ image }
                                render={ ( { open } ) => (
                                    <Button onClick={ open } isPrimary>
                                        { __( 'Select image' ) }
                                    </Button>
                                ) }
                            />
                        ) : '' }

                        { image && imageTag ? (
                            <Fragment>
                                <MediaUpload
                                    onSelect={ ( media ) => {
                                        onImageSelect( media, setAttributes );
                                    } }
                                    allowedTypes={ [ 'image' ] }
                                    value={ image }
                                    render={ ( { open } ) => (
                                        <BaseControl help={ __( 'Click the image to edit or update' ) }>
                                            <a
                                                href="#"
                                                onClick={ open }
                                                className="awb-gutenberg-media-upload"
                                                style={ { display: 'block' } }
                                                dangerouslySetInnerHTML={ { __html: imageTag } }
                                            />
                                        </BaseControl>
                                    ) }
                                />
                                <a
                                    href="#"
                                    onClick={ ( e ) => {
                                        setAttributes( {
                                            image: '',
                                            imageTag: '',
                                            imageSizes: '',
                                        } );
                                        e.preventDefault();
                                    } }
                                >
                                    { __( 'Remove image' ) }
                                </a>
                                <div style={ { marginBottom: 13 } } />
                                { imageSizes ? (
                                    <SelectControl
                                        label={ __( 'Size' ) }
                                        value={ imageSize }
                                        options={ ( () => {
                                            const result = [];
                                            Object.keys( imageSizes ).forEach( ( k ) => {
                                                result.push( {
                                                    value: k,
                                                    label: dashCaseToTitle( k ),
                                                } );
                                            } );
                                            return result;
                                        } )() }
                                        onChange={ v => setAttributes( { imageSize: v } ) }
                                    />
                                ) : '' }
                                <SelectControl
                                    label={ __( 'Background size' ) }
                                    value={ imageBackgroundSize }
                                    options={ [
                                        {
                                            label: __( 'Cover' ),
                                            value: 'cover',
                                        },
                                        {
                                            label: __( 'Contain' ),
                                            value: 'contain',
                                        },
                                        {
                                            label: __( 'Pattern' ),
                                            value: 'pattern',
                                        },
                                    ] }
                                    onChange={ v => setAttributes( { imageBackgroundSize: v } ) }
                                />
                                <TextControl
                                    label={ __( 'Background position' ) }
                                    type="text"
                                    value={ imageBackgroundPosition }
                                    onChange={ v => setAttributes( { imageBackgroundPosition: v } ) }
                                    help={ __( 'Image position. Example: 50% 50%' ) }
                                />
                            </Fragment>
                        ) : '' }
                    </PanelBody>
                ) : '' }

                { type === 'color' ? (
                    <ColorPicker
                        label={ __( 'Background Color' ) }
                        value={ color }
                        onChange={ ( val ) => setAttributes( { color: val } ) }
                        alpha={ true }
                    />
                ) : (
                    <PanelBody
                        title={ (
                            <Fragment>
                                { __( 'Overlay' ) }
                                <ColorIndicator colorValue={ color } />
                            </Fragment>
                        ) }
                        initialOpen={ type === 'color' }
                    >
                        <ColorPicker
                            label={ __( 'Background Color' ) }
                            value={ color }
                            onChange={ ( val ) => setAttributes( { color: val } ) }
                            alpha={ true }
                        />
                    </PanelBody>
                ) }

                <p>
                    { __( 'Install AWB plugin to set video backgrounds and images with parallax support.' ) }
                </p>
                <a
                    className="components-button is-button is-default is-small"
                    href="https://wordpress.org/plugins/advanced-backgrounds/"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    { __( 'Install' ) }
                </a>
            </PanelBody>
        );
    }
}

const BackgroundControlsInspectorWithSelect = withSelect( ( select, props ) => {
    const {
        awb_image: image,
        awb_imageSize: imageSize,
        awb_imageBackgroundSize: imageBackgroundSize,
        awb_imageBackgroundPosition: imageBackgroundPosition,
    } = props.attributes;

    if ( ! image ) {
        return false;
    }

    const data = {
        id: image,
        size: imageSize,
        attr: {
            class: 'jarallax-img',
        },
    };
    let style = '';

    // <img> tag with object-fit style
    if ( imageBackgroundSize !== 'pattern' ) {
        if ( imageBackgroundSize ) {
            style += `object-fit: ${ imageBackgroundSize };`;
        }
        if ( imageBackgroundPosition ) {
            style += `object-position: ${ imageBackgroundPosition };`;
        }

        // ofi polyfill
        if ( style ) {
            style += `font-family: "${ style }";`;
        }

    // background image with pattern size
    } else {
        if ( imageBackgroundSize ) {
            style += 'background-repeat: repeat;';
        }
        if ( imageBackgroundPosition ) {
            style += `background-position: ${ imageBackgroundPosition };`;
        }
        data.div_tag = true;
    }

    // add styles to query
    if ( style ) {
        data.attr.style = style;
    }

    return {
        fetchImageTag: select( 'ghostkit/base/images' ).getImageTagData( data ),
    };
} )( BackgroundControlsInspector );

/**
 * Override background control to add AWB settings
 *
 * @param {Object} Control JSX control.
 * @param {Object} props additional props.
 *
 * @return {Object} Control.
 */
function addBackgroundControls( Control, props ) {
    if ( 'background' === props.attribute && hasBlockSupport( props.props.name, 'awb', false ) ) {
        return (
            <BackgroundControlsInspectorWithSelect
                { ...props.props }
            />
        );
    }

    return Control;
}

/**
 * Override the default edit UI to include background preview.
 *
 * @param {Object} background background JSX.
 * @param {Object} props additional props.
 *
 * @return {Object} Control.
 */
function addEditorBackground( background, props ) {
    if ( hasBlockSupport( props.name, 'awb', false ) ) {
        const {
            awb_color: color,
            awb_type: type,
            awb_imageTag: imageTag,
        } = props.attributes;

        let addBackground = false;

        if ( type === 'color' && color ) {
            addBackground = true;
        }

        if (
            type === 'image' &&
            (
                color ||
                imageTag
            )
        ) {
            addBackground = true;
        }

        if ( addBackground ) {
            return (
                <div className="awb-gutenberg-preview-block">
                    { color ? (
                        <div className="nk-awb-overlay" style={ { 'background-color': color } } />
                    ) : '' }
                    { type === 'image' && imageTag ? (
                        <div className="nk-awb-inner" dangerouslySetInnerHTML={ { __html: imageTag } } />
                    ) : '' }
                </div>
            );
        }

        return '';
    }

    return background;
}

/**
 * Add background
 *
 * @param {Object} background Background jsx.
 * @param {Object} props  Block properties.
 *
 * @return {Object} Filtered props applied to save element.
 */
function addSaveBackground( background, props ) {
    if ( hasBlockSupport( props.name, 'awb', false ) ) {
        const {
            awb_color: color,
            awb_type: type,
            awb_imageTag: imageTag,
            awb_imageBackgroundSize: imageBackgroundSize,
            awb_imageBackgroundPosition: imageBackgroundPosition,
        } = props.attributes;

        let addBackground = false;

        if ( type === 'color' && color ) {
            addBackground = true;
        }

        if (
            type === 'image' &&
            (
                color ||
                imageTag
            )
        ) {
            addBackground = true;
        }

        if ( addBackground ) {
            const dataAttrs = {
                'data-awb-type': type,
            };

            if ( 'image' === type ) {
                if ( imageBackgroundSize ) {
                    dataAttrs[ 'data-awb-image-background-size' ] = imageBackgroundSize;
                }
                if ( imageBackgroundPosition ) {
                    dataAttrs[ 'data-awb-image-background-position' ] = imageBackgroundPosition;
                }
            }

            return (
                <div className="nk-awb">
                    <div className="nk-awb-wrap" { ...dataAttrs }>
                        { color ? (
                            <div className="nk-awb-overlay" style={ { 'background-color': color } } />
                        ) : '' }
                        { type === 'image' && imageTag ? (
                            <div className="nk-awb-inner" dangerouslySetInnerHTML={ { __html: imageTag } } />
                        ) : '' }
                    </div>
                </div>
            );
        }

        return '';
    }

    return background;
}

addFilter( 'blocks.registerBlockType', 'ghostkit/grid/awb/additional-attributes', addAttribute );
addFilter( 'ghostkit.editor.controls', 'ghostkit/grid/awb/addBackgroundControls', addBackgroundControls );
addFilter( 'ghostkit.editor.grid.background', 'ghostkit/grid/awb/addEditorBackground', addEditorBackground );
addFilter( 'ghostkit.editor.grid-column.background', 'ghostkit/grid-column/awb/addEditorBackground', addEditorBackground );
addFilter( 'ghostkit.blocks.grid.background', 'ghostkit-pro/grid/addSaveBackground', addSaveBackground );
addFilter( 'ghostkit.blocks.grid-column.background', 'ghostkit-pro/grid-column/addSaveBackground', addSaveBackground );
