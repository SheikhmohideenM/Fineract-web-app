import {
  Component,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import {
  ActivatedRoute,
  Router,
} from '@angular/router';

import { Dates } from 'app/core/utils/dates';
import { LoansService } from 'app/loans/loans.service';
import { SettingsService } from 'app/settings/settings.service';
import { Currency } from 'app/shared/models/general.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'mifosx-rebate',
  templateUrl: './rebate.component.html',
  styleUrls: ['./rebate.component.scss']
})
export class RebateComponent implements OnInit, OnDestroy {

  @Input() dataObject: any;
  /** Loan Id */
  loanId: string;
  /** Payment Types */
  paymentTypes: any;
  /** Principal Portion */
  principalPortion: any;
  /** Interest Portion */
  interestPortion: any;
  /** Show Payment Details */
  showPaymentDetails = false;
  /** Minimum Date allowed. */
  minDate = new Date(2000, 0, 1);
  /** Maximum Date allowed. */
  maxDate = new Date();
  /** Rebate Loan form. */
  rebateLoanForm: UntypedFormGroup;

  loanData: any;
  currency: Currency | null = null;

  rebateData: any;

  private subscriptions: Subscription = new Subscription();

  /**
   * @param {FormBuilder} formBuilder Form Builder.
   * @param {LoansService} loanService Loan Service.
   * @param {ActivatedRoute} route Activated Route.
   * @param {Router} router Router for navigation.
   * @param {SettingsService} settingsService Settings Service
   */
  constructor(private formBuilder: UntypedFormBuilder,
    private loanService: LoansService,
    private route: ActivatedRoute,
    private router: Router,
    private dateUtils: Dates,
    private settingsService: SettingsService) {
    this.loanId = this.route.snapshot.params['loanId'];
  }

  /**
   * Creates the rebate loan form
   * and initialize with the required values
   */
  ngOnInit() {
    this.createRebateLoanForm();
    this.getLoanDetails();
    this.rebateLoans();
  }

  /**
   * Get loan details.
   */
  getLoanDetails() {
    this.subscriptions.add(
      this.loanService.getLoanAccountAssociationDetails(this.loanId)
        .subscribe((response: any) => {
          this.loanData = response;
          console.log(this.loanData);
        }, (error) => {
          console.error('Error fetching loan details:', error);
        })
    );
  }

  /**
   * Apply rebate to the loan.
   */
  rebateLoans() {
    this.subscriptions.add(
      this.loanService.rebateLoans(this.loanId)
        .subscribe((response: any) => {
          if (response && response.body) {
            this.rebateData = response.body;
          }
          console.log(this.rebateData);
        }, (error) => {
          console.error('Error applying rebate:', error);
        })
    );
  }

  /**
   * Transform rebate options for display.
   */
  transformRebateOptions(rebatePolicies: any[]) {
    return rebatePolicies.map(policy => {
      let label = `${policy.daysFrom}-${policy.daysTo} days (${policy.rebatePercentage}%)`;
      if (policy.daysTo === 9999) {
        label = `Above ${policy.daysFrom} days (${policy.rebatePercentage}%)`;
      }
      return { value: policy.rebatePercentage / 100, label: label };
    });
  }

  /**
   * Clean up subscriptions.
   */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Creates the rebate loan form.
   */
  createRebateLoanForm() {
    this.rebateLoanForm = this.formBuilder.group({
      'transactionDate': [new Date(), Validators.required],
      'transactionAmount': ['', Validators.required],
      'externalId': [''],
      'paymentTypeId': [''],
      'note': [''],
      'rebatePercentage': ['', Validators.required]
    });
  }

  /**
   * Sets the value in the rebate loan form
   */
  setRebateLoanDetails() {
    // Add logic to set form details if needed
  }

  /**
   * Add rebate detail fields to the UI.
   */
  addRebateDetails() {
    // Add logic to add additional details if needed
  }

  /**
   * Submits the rebate loan form.
   */
  submit() {
    if (this.rebateLoanForm.valid) {
      const formValue = this.rebateLoanForm.value;
      console.log('Form Value:', formValue);
      // Add logic to handle form submission
    } else {
      console.error('Form is invalid');
    }
  }

}
