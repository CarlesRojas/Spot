export default class EventsPubSub {
    events = {};

    sub(eventName, func) {
        this.events[eventName] = this.events[eventName] || [];
        this.events[eventName].push(func);
    }

    unsub(eventName, func) {
        if (this.events[eventName])
            for (var i = 0; i < this.events[eventName].length; i++)
                if (this.events[eventName][i] === func) {
                    this.events[eventName].splice(i, 1);
                    break;
                }
    }

    emit(eventName, data) {
        if (this.events[eventName])
            this.events[eventName].forEach(function(func) {
                func(data);
            });
    }
}

/*  EVENTS:

    onWindowResize:             Called when the window is resized                           ()
    onLibraryLoaded:            Calles when library finishes loading                        ()
    onPausePlay:                Called when the user clicks pause/play                      ()
    onSectionChange:            Called when the section changes                             ({ name })
    onVerticalSwipe:            Called the user swipes verticaly on the album picture       ({ normalHeight, smallHeigth, normalTop, miniatureTop, currentSongsTop, currentHeight, currentTop })
    
    
    onSongSelected:             Called when a song is clicked                               ({id})
    onAlbumSelected:            Called when an album is clicked                             ({id})
    onArtistSelected:           Called when an artist is clicked                            ({id})
    onAddClicked:               CARLES complete
    onLikeClicked:              CARLES complete

    onClosePopup:               Called when the back button in a popup is clicked           ({type})

*/
