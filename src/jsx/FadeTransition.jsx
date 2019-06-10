import React, { Component } from "react";
import { Transition } from "react-transition-group";

export default class FadeTransition extends Component {
    constructor(props) {
        super(props);

        this.defaultStyle = this.props.extraStyle || {};
        this.defaultStyle["transition"] = "opacity " + this.props.duration + "ms ease-in-out";

        this.transitionStyle = {
            entering: {
                opacity: "0"
            },
            entered: {
                opacity: "1",
                transitionDelay: this.props.duration + "ms"
            },
            exiting: {
                opacity: "0"
            },
            exited: {
                opacity: "0"
            }
        };
    }

    // Renders the component
    render() {
        return (
            <Transition in={this.props.isOpen} timeout={this.props.duration}>
                {state => {
                    if (state === "exited") return null;
                    return React.Children.map(this.props.children, child => {
                        return React.cloneElement(child, {
                            style: Object.assign({}, this.defaultStyle, this.transitionStyle[state])
                        });
                    });
                }}
            </Transition>
        );
    }
}
