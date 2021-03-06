import { LightningElement, wire,api,track } from 'lwc';

import getOpportunities from "@salesforce/apex/opportinitiesListViewHelper.getOpportunities"
import searchOpportunity from "@salesforce/apex/opportinitiesListViewHelper.searchOpportunity"
import deleteOpportunities from "@salesforce/apex/opportinitiesListViewHelper.deleteOpportunities"
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import { refreshApex } from '@salesforce/apex';

const ACTIONS = [{label: 'Delete', name: 'delete'},
{label: 'View', name: 'view'},
{label: 'Edit', name: 'edit'}]

const COLS = [{label: 'Name', fieldName: 'link', type: 'url',sortable: true, typeAttributes: {label: {fieldName: 'Name'}}},
            {label: 'Amount', fieldName: 'Amount'},
            {label: 'Account', fieldName: "accountLink", type: 'url',sortable: true, typeAttributes: {label: {fieldName: 'AccountName'}}},
            {label: "Close Date", fieldName: 'CloseDate'},
            {label: "Stage Name", fieldName: 'StageName'},
            {label: "Type", fieldName: 'Type'},
            { fieldName: "actions", type: 'action', typeAttributes: {rowActions: ACTIONS}}
]

export default class OpportunitiesListView extends NavigationMixin(LightningElement) {
    
    cols = COLS;
    opportunities;
    wiredOpportunities;
    selectedOpportunities;
    baseData;
    opportunityList = [];
    defaultSortDirection = 'asc';
    @api sortedBy ;
    webServiceInfo;
    @api objectApiName; 
    @track page = 1;
    @track error; 
    @track startingRecord = 1;
    @track endingRecord = 0; 
    @track pageSize = 15; 
    @track totalRecountCount = 0;
    @track items = []; 
    
    @track value;
    @track wiredDataResult;
    @api sortedDirection = 'asc';
    @api searchKey = '';
    @api recordId;
    @track recordId ; 
    @track data;
    @track COLS = COLS;
    @track opportunities;
    @track totalPage = 0;
    hello= true;
    result;
    loading;
    defaultSortDirection = 'asc';
    @api WebServiceIdDet;

	navigateToVisualForcePage(event){
        this[NavigationMixin.Navigate]({
            type: "standard__webPage",
            attributes: {
                url: "https://resilient-moose-khyr7z-dev-ed.lightning.force.com/one/one.app#eyJjb21wb25lbnREZWYiOiJvbmU6YWxvaGFQYWdlIiwiYXR0cmlidXRlcyI6eyJhZGRyZXNzIjoiaHR0cHM6Ly9yZXNpbGllbnQtbW9vc2Uta2h5cjd6LWRldi1lZC0tYy52aXN1YWxmb3JjZS5jb20vYXBleC9PcHBvcnR1bml0eVZpZXc%2FaWQ9MDA2OGQwMDAwMDRtSjBHQUFVIn0sInN0YXRlIjp7fX0%3D"
            }
        });
    }
    sortBy(field, reverse, primer) {
        const key = primer
            ? function (x) {
                  return primer(x[field]);
              }
            : function (x) {
                  return x[field];
              };
    
        return function (a, b) {
            a = key(a);
            b = key(b);
            return reverse * ((a > b) - (b > a));
        };
    }
    onHandleSort(event) {
        const { fieldName: sortedBy, sortDirection } = event.detail;
        const cloneData = [...this.opportunities];
    
        cloneData.sort(this.sortBy(sortedBy, sortDirection === 'asc' ? 1 : -1));
        this.opportunities = cloneData;
        console.log('sort',this.opportunities)
        this.sortDirection = sortDirection;
        this.sortedBy = sortedBy;
    }
    refresh() {
        refreshApex(this.wiredOpportunities);
      }

      previousHandler() {
        this.isPageChanged = true;
        if (this.page > 1) {
            this.page = this.page - 1; //decrease page by 1
            this.displayRecordPerPage(this.page);
        }
          var selectedIds = [];
          for(var i=0; i<this.allSelectedRows.length;i++){
            selectedIds.push(this.allSelectedRows[i].Id);
          }
        this.template.querySelector(
            '[data-id="table"]'
          ).selectedRows = selectedIds;
    }
    //clicking on next button this method will be called
    nextHandler() {
        this.isPageChanged = true;
        if((this.page<this.totalPage) && this.page !== this.totalPage){
            this.page = this.page + 1; //increase page by 1
            this.displayRecordPerPage(this.page);            
        }
          var selectedIds = [];
          for(var i=0; i<this.allSelectedRows.length;i++){
            selectedIds.push(this.allSelectedRows[i].Id);
          }
        this.template.querySelector(
            '[data-id="table"]'
          ).selectedRows = selectedIds;
    }
        //this method displays records page by page
displayRecordPerPage(page){

    this.startingRecord = ((page -1) * this.pageSize) ;
    this.endingRecord = (this.pageSize * page);

    this.endingRecord = (this.endingRecord > this.totalRecountCount) 
                        ? this.totalRecountCount : this.endingRecord; 

    this.opportunities = this.items.slice(this.startingRecord, this.endingRecord);
    this.startingRecord = this.startingRecord + 1;
}

    get selectedOpportunitiesLen() {
        if(this.selectedOpportunities == undefined) return 0;
        return this.selectedOpportunities.length
    }

    @wire(getOpportunities)
    opportunitiesWire(result){
        this.wiredOpportunities = result;
        if(result.data){
            this.opportunities = result.data.map((row) => {
                return this.mapOpportunities(row);
            })
            this.baseData = this.opportunities;
        }
        if(result.error){
            console.error(result.error);
        }
    }

    mapOpportunities(row){
        var accountName = '';
        var accountLink = '';
        if(row.AccountId != undefined){
            accountLink = `/${row.AccountId}`;
            accountName = row.Account['Name'];
        }

        
        

        return {...row,
            Name: `${row.Name}`,
            link: `/${row.Id}`,
            accountLink: accountLink,
            AccountName: accountName,
            Amount: `${row.Amount}`,
            CloseDate: `${row.CloseDate}`,
            StageName: `${row.StageName}`,
            Type: `${row.Type}`,
            
        };
    }

    handleRowSelection(event){
        this.selectedOpportunities = event.detail.selectedRows;
    }

    async handleSearch(event){
        if(event.target.value == ""){
            this.opportunities = this.baseData
        }else if(event.target.value.length > 1){
            const searchOpportunities = await searchOpportunity({searchString: event.target.value})

            this.opportunities = searchOpportunities.map(row => {
                return this.mapOpportunities(row);
            })
        }
    }

    navigateToNewRecordPage() {

        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                objectApiName: 'Opportunity',
                actionName: 'new'
            }
        });
    }
    navigateToDashboardPagePage(event){
        this[NavigationMixin.Navigate]({
            type: 'standard__navItemPage',
            attributes: {
                apiName: 'Opportunities_Dashboard1'
         },
     });
    }

    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;
        this.recordId =  row.Id;
        switch(actionName){
            case 'view':
                this[NavigationMixin.Navigate]({
                    type: 'standard__recordPage',
                    attributes:{
                        recordId: row.Id,
                        actionName: 'view'
                    }
                });
                break;
            case 'edit':
                this[NavigationMixin.Navigate]({
                    type: 'standard__recordPage',
                    attributes:{
                        recordId: row.Id,
                        objectApiName: 'opportunity',
                        actionName: 'edit'
                    }
                });
                break;
            case 'delete' :
                deleteOpportunities({opportunityIds : [event.detail.row.Id]}).then(() => {
                    refreshApex(this.wiredOpportunities);
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            message: 'Record deleted',
                            variant: 'success'
                        })
                        
                    );
                    
                })
                .catch(error => {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Error deleting record',
                            message: error.body.message,
                            variant: 'error'
                        })
                    );
                });
        }
    }

    deleteSelectedOpportunities(){
        const idList = this.selectedOpportunities.map( row => { return row.Id })
        deleteOpportunities({opportunityIds : idList}).then( () => {
            refreshApex(this.wiredOpportunities);
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Records deleted',
                    variant: 'success'
                })
                
            );
            
        })
        .catch(error => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error deleting records',
                    message: error.body.message,
                    variant: 'error'
                })
            );
        });
        this.template.querySelector('lightning-datatable').selectedRows = [];
        this.selectedOpportunities = undefined;
        
    }
}