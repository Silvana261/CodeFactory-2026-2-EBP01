package com.aerodynamic.aerodynamic.pricing_engine.model;
import jakarta.persistence.*;
import com.aerodynamic.aerodynamic.pricing_engine.model.User;


@Entity
@Table(name = "pricing_rules")
public class PricingRule {
    
    // This is the primary key
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column (name = "id_rule")
    private long idRule;

    @Column(name = "bussiness_variable", nullable = false)
    private String bussinessVariable;

    @Column (name = "condition", nullable = false)
    private String condition;

    @Column (name = "adjustment_type", nullable = false)
    private String adjustmentType;

    @Column (name = "adjustment_value", nullable = false)
    private Double adjustmentValue;

    @Column (name = "status", nullable = false)
    private String status;

    @ManyToOne 
    @JoinColumn (name = "creator_user_id", nullable = false)
    private User creatorUser;

    // Constructors

    public PricingRule() {
    }

    public PricingRule(long idRule, String bussinessVariable, String condition, String adjustmentType, Double adjustmentValue, String status) {
        this.idRule = idRule;
        this.bussinessVariable = bussinessVariable;
        this.condition = condition;
        this.adjustmentType = adjustmentType;
        this.adjustmentValue = adjustmentValue;
        this.status = status;
    }

    // Getters and setters (Spring and Services need them to be able to access and modify private attributes)

    public Long getIdRule() {
        return idRule;
    }

    public void setIdRule(Long idRule) {
        this.idRule = idRule;
    }

    public String getBussinessVariable() {
        return bussinessVariable;
    }

    public void setBussinessVariable(String bussinessVariable) {
        this.bussinessVariable = bussinessVariable;
    }

    public String getCondition() {
        return condition;
    }

    public void setCondition(String condition) {
        this.condition = condition;
    }

    public String getAdjustmentType() {
        return adjustmentType;
    }

    public void setAdjustmentType(String adjustmentType) {
        this.adjustmentType = adjustmentType;
    }

    public Double getAdjustmentValue() {
        return adjustmentValue;
    }

    public void setAdjustmentValue(Double adjustmentValue) {
        this.adjustmentValue = adjustmentValue;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
