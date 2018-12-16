import {makeHttpRequest} from './helper.js';

export class EditableField {
        constructor(id,property,field,editButton,currentValue,emptyValue) {
            this.id = id;
            this.field = field;
            this.editButton = editButton;
            this.currentValue = currentValue;
            this.emptyValue = emptyValue;
            this.property = property;
            this.isEditing = false;
            
            // Populate the field
            field.innerHTML = currentValue ? currentValue : emptyValue;

            // Setup the edit button
            this.editButton.addEventListener('click', this.handleEditStart.bind(this));
        }

        handleEditStart() {
            this.isEditing = true; 
            this.editButton.classList.add('hide');

            this.field.innerHTML = this.currentValue;
            this.field.classList.add('editing');
            this.field.contentEditable = true;
            this.placeCaretAtEnd(this.field);

            this.addSaveCancelButtons();
        }

        addSaveCancelButtons() {

            // Create a div to put the buttons in 
            this.buttonDiv = document.createElement('div');

            // Create the save button
            let saveBut = document.createElement('button');
            saveBut.innerHTML = "Save";
            this.buttonDiv.appendChild(saveBut)

            // Create the cancel button
            let cancelBut = document.createElement('button');
            cancelBut.innerHTML = "Cancel";
            this.buttonDiv.appendChild(cancelBut)
            
            // Add event listeners
            saveBut.addEventListener('click', this.handleSave.bind(this))
            cancelBut.addEventListener('click', this.handleCancel.bind(this))

            // Add the buttons beneath the text field
            this.field.parentNode.insertBefore(this.buttonDiv, this.field.nextSibling);

        }

        handleSave() {

            this.isEditing = false; 
            this.editButton.classList.remove('hide');
            this.buttonDiv.innerHTML = "";

            if (this.field.textContent == "") {
                this.field.innerHTML = this.emptyValue;
                this.currentValue = "";
            }
            else {
                this.currentValue = this.field.innerHTML;
            }
    
            this.field.classList.remove('editing');
            this.field.contentEditable = false;


            let data = {};
            data[this.property] = this.currentValue;

            makeHttpRequest(`api/logs/${this.id}`,'PATCH',JSON.stringify(data),'application/json')
            .then(res => {
                console.log(res);
            })

        }

        handleCancel() {

            this.isEditing = false; 
            this.editButton.classList.remove('hide');
            this.buttonDiv.innerHTML = "";

            this.field.innerHTML = this.currentValue ? this.currentValue : this.emptyValue;
            this.field.classList.remove('editing');
            this.field.contentEditable = false;

        }



        // From https://stackoverflow.com/questions/4233265/contenteditable-set-caret-at-the-end-of-the-text-cross-browser
        placeCaretAtEnd(el) {
            el.focus();
            if (typeof window.getSelection != "undefined"
                    && typeof document.createRange != "undefined") {
                var range = document.createRange();
                range.selectNodeContents(el);
                range.collapse(false);
                var sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            } else if (typeof document.body.createTextRange != "undefined") {
                var textRange = document.body.createTextRange();
                textRange.moveToElementText(el);
                textRange.collapse(false);
                textRange.select();
            }
        }

    }