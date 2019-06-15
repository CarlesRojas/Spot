import React, { Component } from "react";
import ItemAlbumArtist from "./ItemAlbumArtist";
import "../css/HorizontalList.css";

export default class HorizontalList extends Component {
    render() {
        const { elements } = this.props;

        var elementComponents = elements.map(({ id, height, width, padding, name, image, selected }) => {
            return (
                <ItemAlbumArtist
                    key={id}
                    id={id}
                    height={height}
                    width={width}
                    padding={padding}
                    name={name}
                    image={image}
                    selected={selected}
                    skeleton={false}
                    type={"album"}
                    noName={true}
                />
            );
        });

        return (
            <div className="horizontalList_wrapper">
                <div className="horizontalList_scroll">{elementComponents}</div>
            </div>
        );
    }
}
