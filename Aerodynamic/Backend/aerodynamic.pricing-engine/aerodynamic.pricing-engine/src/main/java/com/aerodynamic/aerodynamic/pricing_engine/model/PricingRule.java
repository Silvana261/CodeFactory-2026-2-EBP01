package com.aerodynamic.aerodynamic.pricing_engine.model;
import jakarta.persistence.*;
import com.aerodynamic.aerodynamic.pricing_engine.model.enums.AdjustmentType;
import com.aerodynamic.aerodynamic.pricing_engine.model.enums.BussinessVariable;
import com.aerodynamic.aerodynamic.pricing_engine.model.enums.ConditionOperator;
import com.aerodynamic.aerodynamic.pricing_engine.model.enums.StatusRule;


@Entity
@Table(name = "pricing_rules")
public class PricingRule {
    
    // This is the primary key
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column (name = "id_rule")
    private Long idRule;

    @Column(name = "rule_name", nullable = false)
    private String ruleName;

    @Enumerated (EnumType.STRING)
    @Column(name = "bussiness_variable", nullable = false)
    private BussinessVariable bussinessVariable;

    @Enumerated (EnumType.STRING)
    @Column (name = "condition_operator", nullable = false)
    private ConditionOperator conditionOperator;

    @Column (name = "condition_value", nullable = false)
    private Double conditionValue;

    @Enumerated (EnumType.STRING)
    @Column (name = "adjustment_type", nullable = false)
    private AdjustmentType adjustmentType;

    @Column (name = "adjustment_value", nullable = false)
    private Double adjustmentValue;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private StatusRule status;

    @ManyToOne 
    @JoinColumn (name = "creator_user_id", nullable = false)
    private User creatorUser;

    // Constructors

    public PricingRule() {
    }

    public PricingRule(Long idRule, String ruleName, BussinessVariable bussinessVariable, ConditionOperator conditionOperator, AdjustmentType adjustmentType, Double adjustmentValue, StatusRule status, User creatorUser) {
        this.idRule = idRule;
        this.ruleName = ruleName;
        this.bussinessVariable = bussinessVariable;
        this.conditionOperator = conditionOperator;
        this.adjustmentType = adjustmentType;
        this.adjustmentValue = adjustmentValue;
        this.status = status;
        this.creatorUser = creatorUser;
    }

    // Getters and setters (Spring and Services need them to be able to access and modify private attributes)

    public Long getIdRule() {
        return idRule;
    }

    public void setIdRule(Long idRule) {
        this.idRule = idRule;
    }

    public String getRuleName() { 
        return ruleName;
    }

    public void setRuleName(String ruleName) {
        this.ruleName = ruleName;
    }
    
    public BussinessVariable getBussinessVariable() {
        return bussinessVariable;
    }

    public void setBussinessVariable(BussinessVariable bussinessVariable) {
        this.bussinessVariable = bussinessVariable;
    }

    public ConditionOperator getCondition() {
        return conditionOperator;
    }

    public void setCondition(ConditionOperator conditionOperator) {
        this.conditionOperator = conditionOperator;
    }

    public Double getConditionValue() {
        return conditionValue;
    }

    public void setConditionValue(Double conditionValue) {
        this.conditionValue = conditionValue;
    }

    public AdjustmentType getAdjustmentType() {
        return adjustmentType;
    }

    public void setAdjustmentType(AdjustmentType adjustmentType) {
        this.adjustmentType = adjustmentType;
    }

    public Double getAdjustmentValue() {
        return adjustmentValue;
    }

    public void setAdjustmentValue(Double adjustmentValue) {
        this.adjustmentValue = adjustmentValue;
    }

    public StatusRule getStatus() {
        return status;
    }

    public void setStatus(StatusRule status) {
        this.status = status;
    }

    public User getCreatorUser() {
        return creatorUser;
    }

    public void setCreatorUser(User creatorUser) {
        this.creatorUser = creatorUser;
    }
}
