import React, { Component } from 'react';
import Dropzone from 'react-dropzone';

class DropzoneWrapper extends Component {
  constructor(props) {
    super(props);

    this.state = {
      dragActive: false,
    };
  }

  handleDropFile = (accepted, rejected) => {
    const { handleDropFile, handleRejectDropped } = this.props;

    this.handleDragEnd();

    for (const file of accepted) {
      handleDropFile(file);
    }

    for (const file of rejected) {
      handleRejectDropped(file);
    }
  };

  handleDragStart = () => {
    const { handleDragStart } = this.props;
    const { dragActive } = this.state;

    this.setState(
      {
        dragActive: true,
      },
      () => {
        dragActive && handleDragStart();
      }
    );
  };

  handleDragEnd = () => {
    this.setState({
      dragActive: false,
    });
  };

  render() {
    const { dragActive } = this.state;

    return (
      <Dropzone
        className={
          'document-file-dropzone' +
          (dragActive ? ' document-file-dropzone-active' : '')
        }
        disablePreview={true}
        disableClick={true}
        onDragEnter={this.handleDragStart}
        onDragLeave={this.handleDragEnd}
        onDrop={this.handleDropFile}
      >
        {this.props.children}
        <div className="document-file-dropzone-backdrop">
          <span className="document-file-dropzone-info">
            <i className="meta-icon-upload-1" /> Drop files here
          </span>
        </div>
      </Dropzone>
    );
  }
}

export default DropzoneWrapper;
