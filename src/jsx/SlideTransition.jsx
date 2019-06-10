import React, { Component } from "react";
import { Transition } from "react-transition-group";

export default class SlideTransition extends Component {
    constructor(props) {
        super(props);

        this.setDefaultStyle(this.props.duration);

        this.transitionTopToBot = {
            entering: { top: "-100%" },
            entered: { top: "0" },
            exiting: { top: "100%" },
            exited: { top: "100%" }
        };

        this.transitionBotToTop = {
            entering: { top: "100%" },
            entered: { top: "0" },
            exiting: { top: "-100%" },
            exited: { top: "-100%" }
        };

        this.transitionLeftToRight = {
            entering: { left: "-100%" },
            entered: { left: "0" },
            exiting: { left: "100%" },
            exited: { left: "100%" }
        };

        this.transitionRightToLeft = {
            entering: { left: "100%" },
            entered: { left: "0" },
            exiting: { left: "-100%" },
            exited: { left: "-100%" }
        };
    }

    // Seths the default style options
    setDefaultStyle = duration => {
        this.defaultStyle = { transition: `left ${duration}ms ease-in-out, top ${duration}ms ease-in-out` };
    };

    // Renders the component
    render() {
        const { isOpen, duration, moveLeftToRight, children } = this.props;
        this.setDefaultStyle(duration);

        let transition = moveLeftToRight ? this.transitionRightToLeft : this.transitionLeftToRight;

        return (
            <Transition in={isOpen} timeout={duration}>
                {state => {
                    if (state === "exited") return null;
                    return React.Children.map(children, child => {
                        return React.cloneElement(child, {
                            style: Object.assign({}, this.defaultStyle, transition[state])
                        });
                    });
                }}
            </Transition>
        );
    }
}
