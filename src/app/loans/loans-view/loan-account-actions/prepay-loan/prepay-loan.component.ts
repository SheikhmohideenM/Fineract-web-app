/** Angular Imports */
import {
  Component,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import {
  ActivatedRoute,
  Router,
} from '@angular/router';

import { Dates } from 'app/core/utils/dates';
/** Custom Services */
import { LoansService } from 'app/loans/loans.service';
import { SettingsService } from 'app/settings/settings.service';
import { Currency } from 'app/shared/models/general.model';

/**
 * Loan Prepay Loan Option
 */
@Component({
  selector: 'mifosx-prepay-loan',
  templateUrl: './prepay-loan.component.html',
  styleUrls: ['./prepay-loan.component.scss']
})
export class PrepayLoanComponent implements OnInit, OnDestroy {

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
  /** Prepay Loan form. */
  prepayLoanForm: UntypedFormGroup;

  prepayData: any;
  currency: Currency | null = null;

  rebateOptions: any;

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
   * Creates the prepay loan form
   * and initialize with the required values
   */
  ngOnInit() {
    this.maxDate = this.settingsService.businessDate;
    this.createprepayLoanForm();
    this.setPrepayLoanDetails();
    this.prepayData = this.dataObject;

    this.rebateOptions = this.transformRebateOptions(this.dataObject.rebatePolicies);

    if (this.dataObject.currency) {
      this.currency = this.dataObject.currency;
    }
  }

  transformRebateOptions(rebatePolicies: any[]) {
    return rebatePolicies.map(policy => {
      let label = `${policy.daysFrom}-${policy.daysTo} days (${policy.rebatePercentage}%)`;
      if (policy.daysTo === 9999) {
        label = `Above ${policy.daysFrom} days (${policy.rebatePercentage}%)`;
      }
      return { value: policy.rebatePercentage / 100, label: label };
    });
  }

  ngOnDestroy(): void {
  }

  /**
   * Creates the prepay loan form.
   */
  createprepayLoanForm() {
    this.prepayLoanForm = this.formBuilder.group({
      'transactionDate': [new Date(), Validators.required],
      'transactionAmount': ['', Validators.required],
      'externalId': [''],
      'paymentTypeId': [''],
      'note': [''],
      'rebatePercentage': ['', Validators.required]
    });
  }

  /**
   * Sets the value in the prepay loan form
   */
  setPrepayLoanDetails() {
    this.paymentTypes = this.dataObject.paymentTypeOptions;
    this.prepayLoanForm.patchValue({
      transactionAmount: this.dataObject.amount
    });
    this.prepayLoanForm.get('transactionDate').valueChanges.subscribe((transactionDate: string) => {
      const prepayDate = this.dateUtils.formatDate(transactionDate, this.settingsService.dateFormat);

      this.loanService.getLoanPrepayLoanActionTemplate(this.loanId, prepayDate)
        .subscribe((response: any) => {
          this.prepayData = response;
          this.prepayLoanForm.patchValue({
            transactionAmount: this.prepayData.amount
          });
        });
    });
  }

  /**
   * Add payment detail fields to the UI.
   */
  addPaymentDetails() {
    this.showPaymentDetails = !this.showPaymentDetails;
    if (this.showPaymentDetails) {
      this.prepayLoanForm.addControl('accountNumber', new UntypedFormControl(''));
      this.prepayLoanForm.addControl('checkNumber', new UntypedFormControl(''));
      this.prepayLoanForm.addControl('routingCode', new UntypedFormControl(''));
      this.prepayLoanForm.addControl('receiptNumber', new UntypedFormControl(''));
      this.prepayLoanForm.addControl('bankNumber', new UntypedFormControl(''));
    } else {
      this.prepayLoanForm.removeControl('accountNumber');
      this.prepayLoanForm.removeControl('checkNumber');
      this.prepayLoanForm.removeControl('routingCode');
      this.prepayLoanForm.removeControl('receiptNumber');
      this.prepayLoanForm.removeControl('bankNumber');
    }
  }

  // updateTransactionAmount() {
  //   const rebatePercentage = parseFloat(this.prepayLoanForm.get('rebatePercentage').value);
  //   const transactionAmount = parseFloat(this.prepayLoanForm.get('transactionAmount').value);
  //   const baseInterestRate = 0.20;

  //   const rebateTiers = [
  //     { percentage: 0.06, effectiveRate: 0.14 },
  //     { percentage: 0.04, effectiveRate: 0.16 },
  //     { percentage: 0.02, effectiveRate: 0.18 },
  //     { percentage: 0.00, effectiveRate: baseInterestRate }
  //   ];

  //   let effectiveInterestRate = baseInterestRate;
  //   rebateTiers.forEach(tier => {
  //     if (rebatePercentage === tier.percentage) {
  //       effectiveInterestRate = tier.effectiveRate;
  //     }
  //   });

  //   const adjustedAmount = transactionAmount * (1 + effectiveInterestRate);

  //   this.prepayLoanForm.patchValue({
  //     transactionAmount: adjustedAmount.toFixed(2)
  //   });
  // }



  /**
   * Submits the prepay loan form
   */
  submit() {
    const prepayLoanFormData = this.prepayLoanForm.value;
    const locale = this.settingsService.language.code;
    const dateFormat = this.settingsService.dateFormat;
    const prevTransactionDate: Date = this.prepayLoanForm.value.transactionDate;
    if (prepayLoanFormData.transactionDate instanceof Date) {
      prepayLoanFormData.transactionDate = this.dateUtils.formatDate(prevTransactionDate, dateFormat);
    }

    // const rebatePercentage = this.prepayLoanForm.value.rebatePercentage;
    // const transactionAmount = parseFloat(prepayLoanFormData.transactionAmount);
    // const rebateAmount = transactionAmount * rebatePercentage;
    // prepayLoanFormData.transactionAmount = (transactionAmount - rebateAmount).toFixed(2);


    const data = {
      ...prepayLoanFormData,
      dateFormat,
      locale
    };
    data['transactionAmount'] = data['transactionAmount'] * 1;
    this.loanService.submitLoanActionButton(this.loanId, data, 'repayment')
      .subscribe((response: any) => {
        this.router.navigate(['../../general'], { relativeTo: this.route });
      });
  }

}
