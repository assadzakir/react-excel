import React, { Component } from 'react';
import './App.css';

var headers = ["Book", "Author", "Language", "Published", "Sales"];
var  data = [
    ["The Lord of the Rings", "J. R. R. Tolkien",
        "English", "1954–1955", "150 million"],
    ["Le Petit Prince (The Little Prince)", "Antoine de Saint-Exupéry",
        "French", "1943", "140 million"],
    ["Harry Potter and the Philosopher's Stone", "J. K. Rowling",
        "English", "1997", "107 million"],
    ["And Then There Were None", "Agatha Christie",
        "English", "1939", "100 million"],
    ["Dream of the Red Chamber", "Cao Xueqin",
        "Chinese", "1754–1791", "100 million"],
    ["The Hobbit", "J. R. R. Tolkien",
        "English", "1937", "100 million"],
    ["She: A History of Adventure", "H. Rider Haggard",
        "English", "1887", "100 million"]
];

var Excel = React.createClass({

    propTypes: {
        headers: React.PropTypes.arrayOf(
            React.PropTypes.string
        ),
        initialData: React.PropTypes.arrayOf(
            React.PropTypes.arrayOf(
                React.PropTypes.string
            )
        ),
    },
    getInitialState: function() {
        return {
            data: this.props.initialData,
            sortby: null,
            descending: false,
            edit: null,// {row: index, cell: index},
            search: false
        };
    },

    _log: [],
    _logSetState: function (newState) {
// remember the old state in a clone
        if (this._log.length === 0) {
            this._log.push(JSON.parse(JSON.stringify(this.state)));
        }
        this._log.push(JSON.parse(JSON.stringify(newState)));
        this.setState(newState);
    },

    componentDidMount: function() {
        document.onkeydown = function(e) {
            if (e.altKey && e.shiftKey && e.which === 82) { // ALT+SHIFT+R(eplay)
                this._replay();
            }
        }.bind(this);
    },
    
    _replay: function() {
        if (this._log.length === 0) {
            console.warn('No state to replay yet');
            return;
        }
        let idx = -1;
        let interval = setInterval(function() {
            idx++;
            if (idx === this._log.length - 1) { // the end
                clearInterval(interval);
            }
            this.setState(this._log[idx]);
        }.bind(this), 1000);
    },


    render: function() {
        return (
            React.DOM.div(null,
                this._renderToolbar(),
                this._renderTable()
            )
        );
    },


    _renderTable () {
        let self = this;
        return (
            React.DOM.table(null,
                React.DOM.thead({onClick: this._sort},
                    React.DOM.tr(null,
                        this.props.headers.map(function (title, idx) {
                            if (this.state.sortby === idx) {
                                title += this.state.descending ? ' \u2191' : ' \u2193'
                            }
                            return React.DOM.th({key: idx}, title);
                        }.bind(this))
                    )
                ),
                React.DOM.tbody({onDoubleClick: self._showEditor},
                    this._renderSearch(),
                    this.state.data.map(function (row, rowidx) {
                        return (
                            React.DOM.tr({key: rowidx},
                                row.map(function (cell, idx) {
                                    let content  = cell;
                                    let edit = self.state.edit;
                                    if (edit && edit.row === rowidx && edit.cell === idx) {
                                        content = React.DOM.form({onSubmit: self._save},
                                            React.DOM.input({
                                                type: 'text',
                                                defaultValue: content
                                            })
                                        );
                                    }
                                    return React.DOM.td({
                                        key: idx,
                                        'data-row': rowidx
                                    }, content);
                                })
                            )
                        );
                    })
                )
            )
        );
    },
    _renderToolbar: function() {
        return React.DOM.div({className: 'toolbar'},
            React.DOM.button({
                onClick: this._toggleSearch
            }, 'Search'),
            React.DOM.a({
                onClick: this._download.bind(this, 'json'),
                href: 'data.json'
            }, 'Export JSON'),
            React.DOM.a({
                onClick: this._download.bind(this, 'csv'),
                href: 'data.csv'
            }, 'Export CSV')
        );
    },

    /* SORT START````````````````````*/
    _sort(e){
        let column = e.target.cellIndex;
        // copy the data
        let data = this.state.data.slice();
        let descending = this.state.sortby === column && !this.state.descending;

        //Now the actual sorting done via a callback to the sort() method:
        data.sort(function(a, b) {
            return descending
                ? a[column] < b[column]
                : a[column] > b[column];
        });
        //  And finally, setting the state with the new, sorted data:
        this.setState({
            data: data,
            sortby: column,
            descending: descending
        });
    },
    /* SORT END````````````````````*/

    /* EDIT START````````````````````*/
    _showEditor: function(e) {
        this.setState({
            edit: {
                row: parseInt(e.target.dataset.row, 10),
                cell: e.target.cellIndex
            }
        });
    },
    _save: function(e) {
        e.preventDefault();
// ... do the save
        let input = e.target.firstChild;
        let data = this.state.data.slice();
        data[this.state.edit.row][this.state.edit.cell] = input.value;
        this.setState({
            edit: null, // done editing
            data: data
        });
    },
    /* EDIT END````````````````````*/


    /* SEARCH START````````````````````*/
    _search: function(e) {
        let needle = e.target.value.toLowerCase();
        if (!needle) {
            this.setState({data: this._preSearchData});
            return;
        }
        let idx = e.target.dataset.idx;
        let searchdata = this._preSearchData.filter(function (row) {
            return row[idx].toString().toLowerCase().indexOf(needle) > -1;
        });
        this.setState({data: searchdata});
    },
    _renderSearch: function() {
        if (!this.state.search) {
            return null;
        }
        return (
            React.DOM.tr({onChange: this._search},
                this.props.headers.map(function(_ignore, idx) {
                    return React.DOM.td({key: idx},
                        React.DOM.input({
                            type: 'text',
                            'data-idx': idx,
                        })
                    );
                })
            )
        );
    },
    _toggleSearch: function() {
        if (this.state.search) {
            this.setState({
                data: this._preSearchData,
                search: false
            });
            this._preSearchData = null;
        } else {
            this._preSearchData = this.state.data;
            this.setState({
                search: true
            });
        }
    },
    /* SEARCH END````````````````````*/

    /* Download Start````````````````````*/
    _download: function (format, ev) {
        let contents = format === 'json'
            ? JSON.stringify(this.state.data)
            : this.state.data.reduce(function(result, row) {
                return result
                    + row.reduce(function(rowresult, cell, idx) {
                        return rowresult
                            + '"'
                            + cell.replace(/"/g, '""')
                            + '"'
                            + (idx < row.length - 1 ? ',' : '');
                    }, '')
                    + "\n";
            }, '');
        let URL = window.URL || window.webkitURL;
        let blob = new Blob([contents], {type: 'text/' + format});
        ev.target.href = URL.createObjectURL(blob);
        ev.target.download = 'data.' + format;
    },
    /* Download End````````````````````*/
});

class App extends Component {

  render() {
    return (
        React.createElement(Excel, {
            headers: headers,
            initialData: data
        })
    );
  }
}
export default App;
