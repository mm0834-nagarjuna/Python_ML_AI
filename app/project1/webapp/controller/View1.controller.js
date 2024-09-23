
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment"
], function (Controller, JSONModel, MessageToast, Fragment) {
    "use strict";

    return Controller.extend("frontend.project1.controller.View1", {
        responseData: [],

        onInit: function () { },
        onSend: function () {
            var oTextArea = this.getView().byId("promptInput");
            var sText = oTextArea.getValue();

            var oPayload = {
                "question": sText
            };

            if (oPayload.question !== '') {
                this.showBusyDialog();
                var that = this;

                var sUrl = "https://myApp-appreciative-gerenuk-xj.cfapps.us10-001.hana.ondemand.com/generate";
                $.ajax({
                    url: sUrl,
                    type: "POST",
                    contentType: "application/json",
                    data: JSON.stringify(oPayload),
                    success: function (oResponse) {
                        console.log(oResponse);
                        if (oResponse.updateError) {
                            console.log(oResponse);
                            that.onShowWarningDialog(oResponse);
                        } else {
                            if (oResponse.data.length === 1) {
                                that._updatePanels(oResponse);
                            } else if (typeof (oResponse.data) === 'string') {
                                alert(oResponse.data);
                            }
                             else if (oResponse.data.length === 0) {
                                oResponse.data.push({"message":'Not Found'})
                                that._updatePanels(oResponse);
                            } else {
                                console.log('More than one object');
                                that._createTable(oResponse);
                            }
                        } 
                        MessageToast.show("Request successful");
                    },
                    error: function (oError) {
                        that.showErrorDialog(oError.responseText);
                    },
                    complete: function () {
                        that.hideBusyDialog();
                        oTextArea.setValue("");
                    }
                });
            } else {
                alert('Please enter any prompt');
            }
        },


        _updatePanels: function (resItem) {
            this.responseData.unshift(resItem);
            var oVBox = this.getView().byId("vbox1");
            resItem.data.forEach(element => {
                var oCardContent = new sap.m.VBox({
                    width: "100%",
                    items: []
                });

                Object.keys(element).forEach(outerkey => {
                    var oValueText = new sap.m.Text({
                        text: element[outerkey],
                        textAlign: "Left"
                    });

                    var oListItem = new sap.m.InputListItem({
                        label: outerkey,
                        content: [
                            oValueText
                        ]
                    });

                    var oList = new sap.m.List({
                        items: [
                            oListItem
                        ]
                    });

                    oCardContent.addItem(oList);
                });

                var oCard = new sap.f.Card({
                    width: "100%",
                    content: oCardContent
                });

                var oPanel = new sap.m.Panel({
                    headerText: "Prompt: " + resItem.prompt,
                    content: [oCard]
                });
                oPanel.addStyleClass("sapUiSmallMargin");

                oVBox.insertItem(oPanel, 0);
            });
        },


        _createTable: function (resItems) {
            try {
                console.log(resItems);
                this.responseData.unshift(resItems);
                console.log(this.responseData);
                var oVBox = this.getView().byId("vbox1");


                var oTable = new sap.m.Table({
                    class: "sapUiResponsiveContentPadding",
                    tableType: "ResponsiveTable",
                    inset: true,
                    growing: true,
                    growingThreshold: 10,
                    alternateRowColors: true,
                    autoPopinMode: true,
                    columns: [],
                    items: []
                });

                var columnData = Object.keys(resItems.data[0]).map(key => {
                    return {
                        columnName: key
                    };
                });

                var rowData = resItems.data.map(data => {
                    return data;
                });


                var tableModel = new sap.ui.model.json.JSONModel();
                tableModel.setData({
                    rows: rowData,
                    columns: columnData
                });


                oTable.setModel(tableModel);


                columnData.forEach(function (column) {
                    oTable.addColumn(new sap.m.Column({
                        header: new sap.m.Text({ text: column.columnName })
                    }));
                });


                var oTemplate = new sap.m.ColumnListItem({
                    cells: columnData.map(function (column) {
                        return new sap.m.Text({ text: "{" + column.columnName + "}" });
                    })
                });
                var rowCount = rowData.length;

                var oSubHeader = new sap.m.Toolbar({
                    content: [
                        new sap.m.Title({ text: "Prompt : " + resItems.prompt, }),
                        new sap.m.ToolbarSpacer(),
                        new sap.m.Label({ text: "(" + rowCount + " items)" })
                    ]
                });
                oTable.setHeaderToolbar(oSubHeader);

                var oTemplate = new sap.m.ColumnListItem({
                    cells: columnData.map(function (column) {
                        if (column.columnName === "ORDERSTATUS") {
                            return new sap.m.ObjectStatus({
                                text: "{" + column.columnName + "}",
                                state: {
                                    path: column.columnName,
                                    formatter: function (sStatus) {
                                        switch (sStatus.toLowerCase()) {
                                            case "pending":
                                                return "Warning";
                                            case "delivered":
                                                return "Success";
                                            case "cancelled":
                                                return "Error";
                                            default:
                                                return "None";
                                        }
                                    }
                                }
                            });
                        } else {
                            return new sap.m.Text({ text: "{" + column.columnName + "}" });
                        }
                    })
                });

                oTable.bindItems({
                    path: "/rows",
                    template: oTemplate
                });

                // Add the table to the VBox
                oVBox.insertItem(oTable, 0);
            } catch (error) {
                console.log(error)
            }
        },
        showErrorDialog: function (oError) {
            var oView = this.getView();
            oError = JSON.parse(oError)
            if (!this._pErrorDialog) {
                this._pErrorDialog = Fragment.load({
                    name: "frontend.project1.fragment.ErrorDialog",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    return oDialog;
                });
            }

            this._pErrorDialog.then(function (oDialog) {
                var oModel = new JSONModel({
                    errorTitle: oError.error,
                    errorMessage: oError.message,
                });
                oDialog.setModel(oModel);
                oDialog.open();
            }.bind(this));


        },

        onCloseErrorDialog: function () {
            if (this._pErrorDialog) {
                this._pErrorDialog.then(function (oDialog) {
                    oDialog.close();
                });
            }

        },
        onShowWarningDialog: function (oWarning) {
            if (!this._pWarningDialog) {
                this._pWarningDialog = Fragment.load({
                    name: "frontend.project1.fragment.UpdateError",
                    controller: this
                }).then(function (oWarningDialog) {
                    this.getView().addDependent(oWarningDialog);
                    return oWarningDialog;
                }.bind(this));
            }

            this._pWarningDialog.then(function (oWarningDialog) {
                var oModel = new JSONModel({
                    warningTitle: oWarning.updateError,
                    warningMessage: oWarning.prompt,
                });
                oWarningDialog.setModel(oModel);
            })

            this._pWarningDialog.then(function (oWarningDialog) {
                oWarningDialog.open();
            }.bind(this));
        },
        onRetryWarningDialog: function () {
            var that = this;

            if (this._pWarningDialog) {
                this._pWarningDialog.then(function (oWarningDialog) {
                    var oPayload = {
                        "question": ''
                    };

                    var data = oWarningDialog.getModel().getData();
                    oPayload.question = data.warningMessage;


                    var sUrl = "https://myApp-appreciative-gerenuk-xj.cfapps.us10-001.hana.ondemand.com/generate";

                    // Log payload and URL
                    console.log("Payload:", JSON.stringify(oPayload));
                    console.log("URL:", sUrl);
                    that.showBusyDialog()
                    // Make AJAX POST request
                    $.ajax({
                        url: sUrl,
                        type: 'POST',
                        contentType: "application/json",
                        data: JSON.stringify(oPayload),
                        success: function (res) {
                            console.log("Response:", res);
                            if (res.updateError) {
                                console.log(res);
                                that.onShowWarningDialog(res);
                            } else {
                                if (res.data.length === 1) {
                                    that._updatePanels(res);
                                } else if (typeof (res.data) === 'string') {
                                    alert(res.data);
                                } else {
                                    console.log('More than one object');
                                    that._createTable(res);
                                }
                                that.onCloseWarningDialog()
                            }
                        },
                        error: function (error) {
                            console.error("Error:", error);
                        },
                        complete: function () {
                            that.hideBusyDialog()
                        }
                    });
                }).catch(function (error) {
                    console.error("Promise error:", error);
                });
            }
        },


        onCloseWarningDialog: function () {
            if (this._pWarningDialog) {
                this._pWarningDialog.then(function (oWarningDialog) {
                    oWarningDialog.close();
                });
            }
        },
        showBusyDialog: function () {
            var oView = this.getView();

            if (!this._pBusyDialog) {

                this._pBusyDialog = Fragment.load({
                    name: "frontend.project1.fragment.BusyDialog",
                    controller: this
                }).then(function (oBusyDialog) {
                    oView.addDependent(oBusyDialog);
                    return oBusyDialog;
                });
            }


            this._pBusyDialog.then(function (oBusyDialog) {
                oBusyDialog.open();
            });
        },
        hideBusyDialog: function () {
            if (this._pBusyDialog) {
                this._pBusyDialog.then(function (oBusyDialog) {
                    oBusyDialog.close();
                });
            }
        }


    });
});



